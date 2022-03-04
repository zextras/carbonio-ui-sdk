/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-console */
const { execSync } = require('child_process');
const chalk = require('chalk');
const { handler: build, builder: buildOptions } = require('./build');
const { pkg } = require('./utils/pkg');
const { buildSetup } = require('./utils/setup');
const { printArgs } = require('./utils/console');

const pathPrefix = '/opt/zextras/web/iris/';

const updateJson = (appJson, carbonioJson, stats) => {
	const components = carbonioJson.components.filter(
		(component) => component.name !== pkg.carbonio.name
	);
	components.push(appJson);
	return { components };
};

exports.command = 'deploy';
exports.desc = 'Build and inject the project to a Carbonio instance';
exports.builder = Object.assign({
	host: {
		desc: 'Destination hostname',
		demandOption: true,
		alias: 'h',
	},
	user: {
		desc: 'Username for ssh access',
		alias: 'u',
		default: 'root',
	}
}, buildOptions);

exports.handler = async (options) => {
	printArgs(options, 'Deploy');
	await build(options);
	if (options.host) {
		const target = `${options.user}@${options.host}`;
		console.log(`- Deploying to ${chalk.bold(target)}...`);
		execSync(
			`ssh ${target} "cd ${pathPrefix} && rm -rf ${pkg.carbonio.name}/* && mkdir -p ${pkg.carbonio.name}/${buildSetup.commitHash} ${pkg.carbonio.name}/current"`
		);
		execSync(`scp -r dist/* ${target}:${pathPrefix}${pkg.carbonio.name}/${buildSetup.commitHash}`);
		console.log(`- Updating ${chalk.bold('components.json')}...`);
		const components = JSON.stringify(
			updateJson(
				JSON.parse(
					execSync(
						`ssh ${target} cat ${pathPrefix}${pkg.carbonio.name}/${buildSetup.commitHash}/component.json`
					).toString()
				),
				JSON.parse(execSync(`ssh ${target} cat ${pathPrefix}components.json`).toString()),
			)
		).replace(/"/g, '\\"');
		execSync(`ssh ${target} "echo '${components}' > ${pathPrefix}components.json"`);
		console.log(`- Updating html indexes...`);
		execSync(
			`ssh ${target} "cp ${pathPrefix}${pkg.carbonio.name}/${buildSetup.commitHash}/*.html ${pathPrefix}${pkg.carbonio.name}/current/ 2>/dev/null || :"`
		);
		console.log(chalk.bgBlue.white.bold('Deploy Completed'));
	} else {
		console.log(chalk.bgYellow.white('Target host not specified, skipping deploy step'));
	}
};
