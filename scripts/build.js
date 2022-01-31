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

function parseArguments() {
	const args = arg(
		{
			'--analyze': Boolean,
			'-a': '--analyze',
			'--verbose': Boolean,
			'-v': '--verbose'
		},
		{
			argv: process.argv.slice(2),
			permissive: true
		}
	);
	return {
		analyzeBundle: args['--analyze'] || false,
		verbose: args['--verbose'] || false
	};
}

const logErrors = (errors, gravity, verbose) => {
	const title = gravity === 'error' ? chalk.bgRed.white : chalk.bgYellow.white;
	const message = gravity === 'error' ? chalk.redBright : chalk.yellowBright;
	errors.forEach((error, i) => {
		console.log(title(`${i + 1}/${errors.length}:`));
		console.log(message(` > ${error.message}`));
		if (error.moduleName) console.log(message('Module: '), error.moduleName);
		if (error.file) console.log(message('File: '), error.file);
		if (error.loc) console.log(message('Path: '), error.loc);
		if (error.details) console.log(message('Details: '), error.details);
		if (error.stack && verbose) console.log(message('Stack: '), error.stack);
	});
}

const logBuild =
	([resolve, reject], options) =>
	(err, stats) => {
		if (err) {
			console.log(chalk.bgRed.white.bold('Webpack Runtime Error'));
			logErrors([err], 'error', options.verbose);
			reject(err);
		}

		const info = stats.toJson();

		if (stats.hasWarnings()) {
			console.log(chalk.bgYellow.white.bold(`Webpack Compilations Warning${info.warnings.length > 1 ? 's' : ''}`));
			logErrors(info.warnings, 'warning', options.verbose);
		}

		if (stats.hasErrors()) {
			console.log(
				chalk.bgRed.white.bold(`Webpack Compilations Error${info.errors.length > 1 ? 's' : ''}`)
			);
			logErrors(info.errors, 'error', options.verbose);
			reject(err);
		} else {
			console.log(chalk.bgBlue.white.bold('Compiled Successfully!'));
		}
		resolve(stats);
	};

exports.runBuild = () =>
	new Promise((...p) => {
		const options = parseArguments();
		console.log('Building ', chalk.green(pkg.carbonio.name));
		console.log('Using base path ', chalk.green(buildSetup.basePath));
		const config = setupWebpackBuildConfig(options, buildSetup);
		const compiler = webpack(config);
		compiler.run(logBuild(p, options));
	});
