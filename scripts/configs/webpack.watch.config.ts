/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import modifyResponse from 'node-http-proxy-json';
import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { styleText } from 'node:util';
import { Configuration } from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';

import {
	type BuildOptions,
	type BuildContext,
	setupWebpackBuildConfig
} from './webpack.build.config';
import { pkg } from '../utils/pkg';

export type WatchOptions = BuildOptions & {
	host: string;
	port?: number;
	ws?: boolean;
	standalone?: boolean;
};

/** One entry of the components.json served by the Carbonio instance. */
type ComponentEntry = {
	name: string;
	commit?: string;
	js_entrypoint?: string;
	[key: string]: unknown;
};

type ComponentsPayload = { components?: ComponentEntry[] };

/** The subset of the express response that the /_cli middleware needs. */
type JsonResponse = { json: (body: unknown) => void };

type WatchConfiguration = Configuration & {
	devServer?: DevServerConfiguration;
};

/* eslint-disable sonarjs/cognitive-complexity -- pre-existing; refactor tracked separately, out of scope for the lint setup */
export const setupWebpackWatchConfig = (
	options: WatchOptions,
	{ basePath, commitHash }: BuildContext
): WatchConfiguration => {
	const defaultConfig = setupWebpackBuildConfig(options, {
		basePath,
		commitHash
	}) as WatchConfiguration;
	const server = `https://${options.host}/`;
	const devServerPort = options.port ?? 9000;
	const localhost = `localhost:${devServerPort}`;
	let serverZappCommitHash: string | undefined;
	defaultConfig.mode = 'development';
	if (defaultConfig.output) {
		defaultConfig.output.filename = '[name].bundle.js';
		defaultConfig.output.chunkFilename = '[name].chunk.js';
	}
	defaultConfig.devServer = {
		liveReload: true,
		port: devServerPort,
		historyApiFallback: {
			index: basePath
		},
		server: 'https',
		setupMiddlewares: (middlewares): typeof middlewares => {
			middlewares.unshift({
				path: '/_cli',
				middleware: (req: IncomingMessage, res: JsonResponse): void => {
					res.json({
						isWatch: true,
						isStandalone: !!options.standalone,
						server,
						app_package: {
							package: options.name,
							name: options.name,
							version: pkg.version,
							description: pkg.description
						}
					});
				}
			});

			return middlewares;
		},
		open: [`https://localhost:${devServerPort}/${pkg.carbonio.type}/`],
		proxy: [
			{
				context: [
					`!${basePath}/**/*`,
					'!/static/iris/components.json',
					`!/static/iris/${options.name}/${commitHash}/i18n/*.json`
				],
				target: server,
				secure: false,
				logLevel: 'debug',
				ws: options.ws ?? false,
				cookieDomainRewrite: {
					'*': server,
					[server]: localhost
				}
			},
			{
				context: ['/static/iris/components.json'],
				target: server,
				secure: false,
				logLevel: 'debug',
				ws: options.ws ?? false,
				cookieDomainRewrite: {
					'*': server,
					[server]: localhost
				},
				selfHandleResponse: false,
				onProxyRes(proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse): void {
					modifyResponse(res, proxyRes, function (body: ComponentsPayload) {
						if (body?.components) {
							console.log(styleText(['green', 'bold'], '[Proxy] modifying components.json'));
							let found = false;
							const components = body.components.reduce((acc: ComponentEntry[], module) => {
								if (module.name === options.name) {
									serverZappCommitHash = module.commit;
									found = true;
									return [...acc, { ...module, js_entrypoint: `${basePath}app.bundle.js` }];
								}
								if (options.standalone) {
									return acc;
								}
								return [...acc, module];
							}, []);
							if (!found) {
								components.push({
									js_entrypoint: `${basePath}app.bundle.js`,
									commit: commitHash,
									description: pkg.description,
									name: options.name,
									priority: pkg.carbonio.priority,
									version: pkg.version,
									type: pkg.carbonio.type,
									attrKey: pkg.carbonio.attrKey,
									icon: pkg.carbonio.icon,
									display: pkg.carbonio.display
								});
							}
							return JSON.stringify({ components });
						}
						console.log(styleText(['green', 'bold'], '[Proxy] components.json: no content'));
						return body;
					});
				}
			},
			{
				context: [`/static/iris/${options.name}/${commitHash}/i18n/*.json`],
				target: server,
				secure: false,
				logLevel: 'debug',
				ws: options.ws ?? false,
				cookieDomainRewrite: {
					'*': server,
					[server]: localhost
				},
				pathRewrite: (urlPath: string): string =>
					urlPath.replace(commitHash, serverZappCommitHash ?? commitHash)
			}
		]
	};

	const confPath = path.resolve(process.cwd(), 'carbonio.webpack.js');
	if (!existsSync(confPath)) {
		return defaultConfig;
	}

	/*
	 * Dynamic require by design: this loads the consumer project's optional
	 * carbonio.webpack.js at runtime, from its cwd. The path is only known then.
	 */
	// eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
	const molder = require(confPath);
	return molder(defaultConfig, pkg, options, 'development');
};
/* eslint-enable sonarjs/cognitive-complexity */
