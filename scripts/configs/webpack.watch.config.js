/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable import/extensions */
const path = require('path');
const fs = require('fs');
const modifyResponse = require('node-http-proxy-json');
const chalk = require('chalk');
const { pkg } = require('../utils/pkg.js');
const { setupWebpackBuildConfig } = require('./webpack.build.config');
exports.setupWebpackWatchConfig = (options, {basePath, commitHash}) => {
	const defaultConfig = setupWebpackBuildConfig(options, { basePath, commitHash}, true)
	const server = `https://${options.host}/`;
	const localhost = `localhost:${options.port}`;
	defaultConfig.mode = 'development';
	defaultConfig.output.filename = '[name].bundle.js'
	defaultConfig.output.chunkFilename = '[name].chunk.js'
	defaultConfig.devServer = {
		hot: true,
		port: options.port ?? 9000,
		historyApiFallback: {
			index: basePath
			// TODO: remove once confirmed that it is not needed
			// rewrites: { from: '/static/iris/carbonio-shell-ui/current', to: `${basePath}/index.html` }
		},
		server: 'https',
		onBeforeSetupMiddleware(devServer) {
			devServer.app.get('/_cli', (req, res) => {
				res.json({
					isWatch: true,
					isStandalone: !!options.standalone,
					server: server,
					app_package: {
						package: options.name,
						name: options.name,
						version: pkg.version,
						description: pkg.description
					}
				});
			});
		},
		open: [`/${pkg.carbonio.type}/`],
		proxy: [
			{
				context: [`!${basePath}/**/*`, '!/static/iris/components.json'],
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
				onProxyRes(proxyRes, req, res) {
					modifyResponse(res, proxyRes, function (body) {
						if (body?.components) {
							console.log(chalk.green.bold('[Proxy] modifying components.json'));
							let found = false;
							const components = body.components.reduce((acc, module) => {
								if (module.name === options.name) {
									found = true;
									return [...acc, {...module, js_entrypoint: `${basePath}app.bundle.js`}];
								}
								if (options.standalone)
									return acc;
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
									display: pkg.carbonio.display,
									sentryDsn: pkg.carbonio.sentryDsn
								})
							}
							return JSON.stringify({ components });
						}
						console.log(chalk.green.bold('[Proxy] components.json: no content'));
						return body;
					});
				}
			}
		]
	}

	const confPath = path.resolve(process.cwd(), 'carbonio.webpack.js');
	if (!fs.existsSync(confPath)) {
		return defaultConfig;
	}

	const molder = require(confPath);
	return molder(defaultConfig, pkg, options, 'development');
};
