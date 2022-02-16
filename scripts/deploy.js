/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-console */
const arg = require('arg');
const { execSync } = require('child_process');
const chalk = require('chalk');
const { runBuild } = require('./build');
const { pkg } = require('./utils/pkg');
const { buildSetup } = require('./utils/setup');
const { printArgs } = require('./utils/console');

const pathPrefix = '/opt/zextras/web/iris/';
function parseArguments() {
	const args = arg(
		{
			'--host': String,
			'-h': '--host',
			'--user': String,
			'-u': '--user'
		},
		{
			argv: process.argv.slice(2),
			permissive: true
		}
	);
	return {
		host: args['--host'],
		user: args['--user'] || 'root'
	};
}

const updateJson = (appJson, carbonioJson) => {
	const components = carbonioJson.components.filter(
		(component) => component.name !== pkg.carbonio.name
	);
	components.push(appJson);
	return { components };
};
exports.runDeploy = async () => {
	const options = printArgs(parseArguments(), 'Deploy');
	await runBuild();
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
