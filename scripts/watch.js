/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-console */
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const { buildSetup } = require('./utils/setup');
const { pkg } = require('./utils/pkg');
const { setupWebpackWatchConfig } = require('./configs/webpack.watch.config');
const { printArgs } = require('./utils/console');

exports.command = 'watch';
exports.desc = 'Run the project in watch mode, proxying against a Carbonio instance';
exports.aliases = ['start'];
exports.builder = {
	host: {
		desc: 'Destination hostname',
		demandOption: true,
		alias: 'h',
	},
	standalone: {
		desc: 'Only load the current module',
		alias: 's',
		defaultOption: false,
		boolean: true
	},
	useLocalDS: {
		desc: 'Use the local DS module instead of the one provided by the remote shell',
		alias: 'u',
		defaultOption: false,
		boolean: true
	}
};

exports.handler = async (options) => {
	printArgs(options, 'Watch');
	console.log('Building ', chalk.green(pkg.carbonio.name));
	console.log('Using base path ', chalk.green(buildSetup.basePath));
	const config = setupWebpackWatchConfig(options, buildSetup);
	const compiler = webpack(config);
	// const watching = compiler.watch( {}, logBuild );
	const server = new WebpackDevServer(config.devServer, compiler);
	const runServer = async () => {
		console.log(chalk.bgBlue.whiteBright.bold('Starting server...'));
		await server.start();
	};
	runServer();
};
