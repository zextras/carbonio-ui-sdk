/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-console */
const arg = require('arg');
const chalk = require('chalk');
const webpack = require('webpack');
const { buildSetup } = require('@zextras/carbonio-ui-sdk/scripts/utils/setup');
const { pkg } = require('@zextras/carbonio-ui-sdk/scripts/utils/pkg');
const { setupWebpackBuildConfig } = require('@zextras/carbonio-ui-sdk/scripts/configs/webpack.build.config');
const { setupWebpackExternalBuildConfig } = require('@zextras/carbonio-ui-sdk/scripts/configs/webpack.external.config');
const {logBuild, printArgs} = require('./utils/console');
function parseArguments() {
	const args = arg(
		{
			'--analyze': Boolean,
			'-a': '--analyze',
			'--verbose': Boolean,
			'-v': '--verbose',
			'--dev': Boolean,
			'-d': '--dev',
			'--external': Boolean,
			'-e': '--external'
		},
		{
			argv: process.argv.slice(2),
			permissive: true
		}
	);
	return {
		analyzeBundle: args['--analyze'] || false,
		verbose: args['--verbose'] || false,
		devMode: args['--dev'] || false,
		external: args['--external'] || false,
	};
}
const runExternalBuild = (options) => {
		console.log('Building external ', chalk.green(pkg.carbonio.name));
		console.log('Using base path ', chalk.green(buildSetup.basePath));
		const externalConfig = setupWebpackExternalBuildConfig(options, buildSetup);
		const compilerExternal = webpack(externalConfig);
		compilerExternal.run(logBuild([], options));
};
exports.runBuild = () =>
	new Promise((...p) => {
		const options = printArgs(parseArguments(), 'Build');
		if (options.external) runExternalBuild(options);
		console.log('Building ', chalk.green(pkg.carbonio.name));
		console.log('Using base path ', chalk.green(buildSetup.basePath));
		const config = setupWebpackBuildConfig(options, buildSetup);
		const compiler = webpack(config);
		compiler.run(logBuild(p, options));
	});
