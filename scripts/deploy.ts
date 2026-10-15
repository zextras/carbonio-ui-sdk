/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';

import { printArgs } from './utils/console';
import { commitHash } from './utils/setup';

const COMPONENTS_JSON = 'components.json';
const DEPLOY_COMPLETED = 'Deploy Completed';
const UPDATING_HTML_INDEXES = '- Updating html indexes...';

export type DeployOptions = {
	name: string;
	admin?: boolean;
	verbose?: boolean;
	host?: string;
	dir?: string;
	container?: string;
	pod?: string;
	namespace: string;
	user: string;
	port?: string;
};

type ComponentEntry = {
	name: string;
	commit: string;
	description: string;
	priority: number;
	version: string;
	type: string;
	attrKey?: string;
	icon?: string;
	display: string;
	js_entrypoint?: string;
};

type ComponentsJson = {
	components: ComponentEntry[];
};

const updateJson = (
	appJson: ComponentEntry,
	carbonioJson: ComponentsJson,
	options: Pick<DeployOptions, 'name'>
): ComponentsJson => {
	const components = carbonioJson.components.filter((component) => component.name !== options.name);
	components.push(appJson);
	return { components };
};

export const command = 'deploy';
export const desc = 'Deploy the project to a Carbonio instance';
export const builder = {
	host: {
		desc: 'Destination hostname',
		demandOption: false,
		alias: 'h'
	},
	dir: {
		desc: 'Destination folder',
		demandOption: false,
		alias: 'f'
	},
	container: {
		desc: 'Destination container',
		demandOption: false,
		alias: 'c'
	},
	pod: {
		desc: 'Destination Kubernetes pod (e.g. carbonio-composed-ui-0 on a local k3d cluster)',
		demandOption: false,
		alias: 'k'
	},
	namespace: {
		desc: 'Kubernetes namespace of the destination pod',
		default: 'carbonio'
	},
	user: {
		desc: 'Username for ssh access',
		alias: 'u',
		default: 'root'
	},
	port: {
		desc: 'Localhost port to use',
		alias: 'p',
		default: ''
	}
};

const deployToContainer = (
	target: string,
	execPrefix: string,
	copyCommand: (dest: string) => string,
	pathPrefix: string,
	options: Pick<DeployOptions, 'name'>
): void => {
	const appPath = `${pathPrefix}${options.name}`;
	console.log(`- Deploying to ${styleText(['blue', 'bold'], target)}...`);
	execSync(`${execPrefix} sh -c '
        find ${appPath} -mindepth 1 -name i18n -prune -o -exec rm -rf {} + &&
        cd ${pathPrefix} && mkdir -p ${options.name}/${commitHash} ${options.name}/current &&
        cd ${options.name}/${commitHash} &&
        ln -sf "../i18n" "i18n"
    '`);

	execSync(copyCommand(`${appPath}/${commitHash}`));
	console.log(`- Updating ${styleText(['blue', 'bold'], COMPONENTS_JSON)}...`);
	const components = JSON.stringify(
		updateJson(
			JSON.parse(
				execSync(`${execPrefix} sh -c "cat ${appPath}/${commitHash}/component.json"`).toString()
			),
			JSON.parse(execSync(`${execPrefix} sh -c "cat ${pathPrefix}components.json"`).toString()),
			options
		)
	).replace(/"/g, '\\"');
	execSync(`${execPrefix} sh -c "echo '${components}' > ${pathPrefix}components.json"`);
	console.log(UPDATING_HTML_INDEXES);
	execSync(
		`${execPrefix} sh -c "cd ${appPath}/${commitHash} && find . -name "*.html" -exec cp --parents "{}" ${appPath}/current/ \\;"`
	);
	console.log(styleText(['blue', 'bold'], DEPLOY_COMPLETED));
};

export const handler = async (options: DeployOptions): Promise<void> => {
	const pathPrefix = `/opt/zextras/${options.admin ? 'admin' : 'web'}/iris/`;
	printArgs(options, 'Deploy');
	const distPath = path.resolve(process.cwd(), 'dist');
	if (!existsSync(distPath)) {
		console.log(
			styleText(['red', 'bold'], 'Missing dist folder, skipping deploy step. Run build step before')
		);
		return;
	}

	if (!options.host && !options.dir && !options.container && !options.pod) {
		console.log(
			styleText(
				['red', 'bold'],
				'No target (host, directory, container or pod) specified, skipping deploy step'
			)
		);
		return;
	}

	/**
	 * Remote server deploy
	 */
	if (options.host) {
		const cpTarget = `${options.user}@${options.host}`;
		const sshTarget = `${options.user}@${options.host}${options.port && ' -p'} ${options.port}`;
		console.log(`- Deploying to server ${styleText(['blue', 'bold'], sshTarget)}...`);
		execSync(`ssh ${sshTarget} '
        find ${pathPrefix}${options.name} -mindepth 1 -name i18n -prune -o -exec rm -rf {} + &&
        cd ${pathPrefix} && mkdir -p ${options.name}/${commitHash} ${options.name}/current &&
        ln -sf ${pathPrefix}${options.name}/i18n "${pathPrefix}${options.name}/${commitHash}/i18n"
    '`);

		execSync(
			`scp -r ${options.port && '-P'} ${
				options.port
			} dist/* ${cpTarget}:${pathPrefix}${options.name}/${commitHash}`
		);
		console.log(`- Updating ${styleText(['blue', 'bold'], COMPONENTS_JSON)}...`);
		const components = JSON.stringify(
			updateJson(
				JSON.parse(
					execSync(
						`ssh ${sshTarget} cat ${pathPrefix}${options.name}/${commitHash}/component.json`
					).toString()
				),
				JSON.parse(execSync(`ssh ${sshTarget} cat ${pathPrefix}components.json`).toString()),
				options
			)
		).replace(/"/g, '\\"');
		execSync(`ssh ${sshTarget} "echo '${components}' > ${pathPrefix}components.json"`);
		console.log(UPDATING_HTML_INDEXES);
		execSync(
			`ssh ${sshTarget} "cd ${pathPrefix}${options.name}/${commitHash} && find . -name "*.html" -exec cp --parents "{}" ${pathPrefix}${options.name}/current/ \\;"`
		);
		console.log(styleText(['blue', 'bold'], DEPLOY_COMPLETED));
	}

	/**
	 * Local directory deploy
	 */
	if (options.dir) {
		// Check if target directory exists
		if (!existsSync(options.dir)) {
			console.log(
				styleText(
					['red', 'bold'],
					`Target directory ${styleText(['blue', 'bold'], options.dir)} does not exist, skipping deploy step`
				)
			);
			return;
		}

		console.log(`- Deploying to local directory ${styleText(['blue', 'bold'], options.dir)}...`);

		execSync(`
        find ${options.dir}/${options.name} -mindepth 1 -name i18n -prune -o -exec rm -rf {} + &&
        cd ${options.dir} && mkdir -p ${options.name}/${commitHash} ${options.name}/current &&
        cd ${options.dir}/${options.name}/${commitHash} &&
        ln -sf "../i18n" "i18n"
    `);
		execSync(`cp -r dist/* ${options.dir}/${options.name}/${commitHash}`);

		console.log(`- Updating ${styleText(['blue', 'bold'], COMPONENTS_JSON)}...`);
		const components = JSON.stringify(
			updateJson(
				JSON.parse(
					execSync(`cat ${options.dir}/${options.name}/${commitHash}/component.json`).toString()
				),
				JSON.parse(execSync(`cat ${options.dir}/components.json`).toString()),
				options
			)
		);
		execSync(`echo '${components}' > ${options.dir}/components.json`);
		console.log(UPDATING_HTML_INDEXES);
		execSync(
			`cd ${options.dir}/${options.name}/${commitHash} && find . -name "*.html" -exec cp --parents "{}" ${options.dir}/${options.name}/current/ \\;`
		);
		console.log(styleText(['blue', 'bold'], DEPLOY_COMPLETED));
	}

	/**
	 * Container deploy
	 */
	if (options.container) {
		deployToContainer(
			`container ${options.container}`,
			`docker exec ${options.container}`,
			(dest) => `docker cp dist/. ${options.container}:${dest}`,
			pathPrefix,
			options
		);
	}

	/**
	 * Kubernetes pod deploy (e.g. a local k3d cluster)
	 */
	if (options.pod) {
		const kubectl = `kubectl -n ${options.namespace}`;
		deployToContainer(
			`pod ${options.namespace}/${options.pod}`,
			`${kubectl} exec ${options.pod} --`,
			(dest) =>
				`COPYFILE_DISABLE=1 tar --no-xattrs -C dist -cf - . | ${kubectl} exec -i ${options.pod} -- tar --no-same-owner -C ${dest} -xf -`,
			pathPrefix,
			options
		);
	}
};
