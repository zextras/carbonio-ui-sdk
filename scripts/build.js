/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-console */
const chalk = require('chalk');
const webpack = require('webpack');
const { commitHash } = require('./utils/setup');
const { pkg } = require('./utils/pkg');
const { setupWebpackBuildConfig } = require('./configs/webpack.build.config');
const { setupWebpackExternalBuildConfig } = require('./configs/webpack.external.config');
const {logBuild, printArgs} = require('./utils/console');
const { rmSync } = require('fs');

exports.command = 'build';
exports.desc = 'Compile and bundle your project';
exports.builder = {
	analyze: {
		desc: 'Apply the BundleAnalyzerPlugin and launch its web ui after the compilation',
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
	},
	pkgRel: {
		desc: 'pkgRel value to pass to the PKGBUILD template',
		default: '1',
	}
};

const runExternalBuild = (options, buildSetup) => new Promise((...p) => {
		console.log('Building ', chalk.bold.yellow('external '), chalk.green(options.name));
		console.log('Using base path ', chalk.green(buildSetup.basePath));
		const externalConfig = setupWebpackExternalBuildConfig(options, buildSetup);
		const compilerExternal = webpack(externalConfig);
		compilerExternal.run(logBuild(p, options));
});
exports.handler = async (options) =>
	new Promise(async (...p) => {
		printArgs(options, 'Build');
		const basePath = `/static/iris/${options.name}/${commitHash}/`;
		if (options.external) await runExternalBuild(options, { basePath, commitHash });
		console.log('Building ', chalk.green(options.name));
		console.log('Using base path ', chalk.green(basePath));
		const config = setupWebpackBuildConfig(options, { basePath, commitHash });
		const compiler = webpack(config);
		rmSync('dist', {recursive: true, force: true});
		compiler.run(logBuild(p, options));
	});
