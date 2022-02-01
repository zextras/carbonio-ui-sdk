#!/usr/bin/env node
/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const arg = require('arg');
const chalk = require('chalk');

const { runCoffee } = require('./coffee');
const { runBuild } = require('./build');
const { runDeploy } = require('./deploy');
const { runHelp } = require('./help');
const { runWatch } = require('./watch');

function parseArguments(rawArgs) {
	const args = arg(
		{
			'--help': Boolean
		},
		{
			argv: rawArgs.slice(2),
			permissive: true
		}
	);
	return {
		showHelp: args['--help'] || false
	};
}
const sdk = async () => {
	const options = parseArguments(process.argv);
	if (options.showHelp) {
		runHelp();
		return;
	}
	switch (process.argv[2]) {
		case 'coffee': {
			runCoffee();
			break;
		}
		case 'build': {
			runBuild();
			break;
		}
		case 'deploy': {
			runDeploy();
			break;
		}
		case 'help': {
			runHelp();
			break;
		}
		/*	case 'init': {
				await createProject(args);
				break;
			} */
		case 'watch': {
			await runWatch();
			break;
		}
		default: {
			console.error('%s Invalid command', chalk.red.bold('ERROR'));
		}
	}
};

sdk();
