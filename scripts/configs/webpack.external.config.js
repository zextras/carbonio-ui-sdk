/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const webpack = require('webpack');

const { pkg } = require('../utils/pkg.js');
const path = require('path');
const { createBabelConfig } = require('./babelrc.build.js');
const fs = require('fs');

exports.setupWebpackExternalBuildConfig = (options, { basePath }) => {
	const defaultConfig = {
		mode: options.devMode ? 'development' : 'production',
		devtool: 'source-map',
		target: 'web',
		module: {
			rules: [
				{
					test: /\.[jt]sx?$/,
					exclude: /node_modules/,
					loader: require.resolve('babel-loader'),
					options: createBabelConfig(`babel.config.js`, options, pkg)
				},
				{
					test: /\.(png|jpg|gif|woff2?|svg|eot|ttf|ogg|mp3)$/,
					use: [
						{
							loader: require.resolve('file-loader'),
							options: {}
						}
					]
				}
			]
		},
		output: {
			path: path.resolve(process.cwd(), 'dist'),
			filename: '[name].[fullhash].js',
			chunkFilename: '[name].[chunkhash:8].chunk.js',
			publicPath: basePath
		},
		plugins: []
	};

	const confPath = path.resolve(process.cwd(), 'external.webpack.js');

	if (!fs.existsSync(confPath)) {
		return defaultConfig;
	}

	const molder = require(confPath);
	return molder(defaultConfig, pkg, options, options.devMode ? 'development' : 'production');
};
