#!/usr/bin/env node
/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const { pkg } = require('./utils/pkg');

yargs(hideBin(process.argv))
	.options({
		verbose: {
			alias: 'v',
			desc: 'Verbose logging',
			default: false,
			boolean: true
		},
		admin: {
			alias: 'a',
			desc: 'Build/Watch in admin mode, defaults to true only for the admin packages',
			default: pkg.carbonio.type === 'carbonioAdmin',
			boolean: true
		},
		name: {
			alias: 'n',
			desc: 'Alternative name to use for the package, overrides the carbonio.name field',
			default: pkg.carbonio.name
		}
	})
	.command(require('./build'))
	.command(require('./deploy'))
	.command(require('./watch'))
	.command(require('./coffee'))
	.usage('Usage: npx $0 <command> [options]')
	.demandCommand()
	.parse()
