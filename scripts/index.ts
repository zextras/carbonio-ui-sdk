#!/usr/bin/env node
/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { pkg } from './utils/pkg';

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
			default: pkg.carbonio?.name
		},
		svgr: {
			desc: 'use svgr-loader instead of file-loader for svg files',
			boolean: true,
			default: pkg.sdk?.svgr ?? false
		}
	})
	/*
	 * Untyped require() on purpose: each command module types its handler against its
	 * own options (BuildOptions, WatchOptions, …), which is narrower than the
	 * ArgumentsCamelCase<any> that yargs' CommandModule expects. Static imports would
	 * surface that mismatch as a type error without making the code any safer.
	 */
	/* eslint-disable @typescript-eslint/no-var-requires */
	.command(require('./build'))
	.command(require('./deploy'))
	.command(require('./install'))
	.command(require('./watch'))
	/* eslint-enable @typescript-eslint/no-var-requires */
	.usage('Usage: npx $0 <command> [options]')
	.demandCommand(1, 'You need to specify at least one command')
	.parse();
