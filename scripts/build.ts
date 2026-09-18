/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { rmSync } from 'node:fs';
import { styleText } from 'node:util';
import webpack from 'webpack';

import { setupWebpackBuildConfig, type BuildOptions } from './configs/webpack.build.config';
import { logBuild, printArgs } from './utils/console';
import { commitHash } from './utils/setup';

export const command = 'build';
export const desc = 'Compile and bundle your project';
export const builder = {
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
	pkgRel: {
		desc: 'pkgRel value to pass to the PKGBUILD template',
		default: '1'
	}
};

export const handler = async (options: BuildOptions): Promise<unknown> =>
	new Promise((...p) => {
		printArgs(options, 'Build');
		const basePath = `/static/iris/${options.name}/${commitHash}/`;
		rmSync('dist', { recursive: true, force: true });
		console.log('Building ', styleText(['green', 'bold'], options.name));
		console.log('Using base path ', styleText(['green', 'bold'], basePath));
		const config = setupWebpackBuildConfig(options, { basePath, commitHash });
		const compiler = webpack(config);
		compiler.run(logBuild(p, options));
	});
