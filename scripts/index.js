#!/usr/bin/env node
/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')
yargs(hideBin(process.argv))
	.options({
		verbose: {
			alias: 'v',
			desc: 'Verbose logging',
			default: false,
			boolean: true
		}
	})
	.command(require('./build'))
	.command(require('./deploy'))
	.command(require('./watch'))
	.command(require('./coffee'))
	.usage('Usage: npx $0 <command> [options]')
	.demandCommand()
	.parse()
