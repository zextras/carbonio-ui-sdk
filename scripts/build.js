/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-console */
const chalk = require('chalk');
const webpack = require('webpack');
const { buildSetup } = require('./utils/setup');
const { pkg } = require('./utils/pkg');
const { setupWebpackBuildConfig } = require('./configs/webpack.build.config');
const { setupWebpackExternalBuildConfig } = require('./configs/webpack.external.config');
const {logBuild, printArgs} = require('./utils/console');
const { rmSync } = require('fs');

exports.command = 'build';
exports.desc = 'Compile and bundle your project';
exports.builder = {
	analyze: {
		desc: 'Apply the BundleAnalyzerPlugin and launch the web ui after the compilation',
		alias: 'a',
		default: false,
		boolean: true
	},
	dev: {
		desc: 'Build in devMode',
		alias: 'd',
		default: false,
		boolean: true
	},
	external: {
		desc: 'Run an additional build for external resources',
		alias: 'e',
		default: false,
		boolean: true
	}
};

const runExternalBuild = (options) => new Promise((...p) => {
		console.log('Building ', chalk.bold.yellow('external '), chalk.green(pkg.carbonio.name));
		console.log('Using base path ', chalk.green(buildSetup.basePath));
		const externalConfig = setupWebpackExternalBuildConfig(options, buildSetup);
		const compilerExternal = webpack(externalConfig);
		compilerExternal.run(logBuild(p, options));
});
exports.handler = async (options) =>
	new Promise(async (...p) => {
		printArgs(options, 'Build');
		if (options.external) await runExternalBuild(options);
		console.log('Building ', chalk.green(pkg.carbonio.name));
		console.log('Using base path ', chalk.green(buildSetup.basePath));
		const config = setupWebpackBuildConfig(options, buildSetup);
		const compiler = webpack(config);
		rmSync('dist', {recursive: true, force: true});
		compiler.run(logBuild(p, options));
	});
