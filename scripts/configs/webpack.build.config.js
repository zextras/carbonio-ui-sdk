/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable import/extensions */
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const semver = require('semver');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { createBabelConfig } = require('./babelrc.build.js');
const { pkg } = require('../utils/pkg.js');

exports.setupWebpackBuildConfig = (options, { basePath, commitHash }) => {
	const plugins = [
		// new webpack.ProvidePlugin({
		// 	process: 'process/browser'
		// }),
		new webpack.DefinePlugin({
			PACKAGE_VERSION: JSON.stringify(pkg.version),
			ZIMBRA_PACKAGE_VERSION: semver.valid(semver.coerce(pkg.version)),
			PACKAGE_NAME: JSON.stringify(pkg.carbonio.name)
		}),
		new MiniCssExtractPlugin({
			// Options similar to the same options in webpackOptions.output
			// all options are optional
			filename: 'style.[chunkhash:8].css',
			chunkFilename: '[id].css',
			ignoreOrder: false // Enable to remove warnings about conflicting order
		}),
		new HtmlWebpackPlugin({
			inject: false,
			template: path.resolve(__dirname, './component.template'),
			filename: 'component.json',
			name: pkg.carbonio.name,
			description: pkg.description,
			version: pkg.version,
			commit: commitHash,
			priority: pkg.carbonio.priority,
			type: pkg.carbonio.type,
			attrKey: pkg.carbonio.attrKey ?? '',
			icon: pkg.carbonio.icon ?? 'CubeOutline',
			display: pkg.carbonio.display
		})
	];
	if (options.analyzeBundle) {
		plugins.push(new BundleAnalyzerPlugin());
	}

	plugins.push(
		new CopyPlugin({
			patterns: [
				{ from: 'translations', to: 'i18n' },
				{ from: 'CHANGELOG.md', to: '.', noErrorOnMissing: true }
			]
		})
	);

	const entry = {};
	const alias = {};

	entry.app = path.resolve(__dirname, '../utils/entry.js');
	alias['app-entrypoint'] = path.resolve(process.cwd(), 'src/app.jsx');

	const defaultConfig = {
		entry,
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
					test: /\.(less|css)$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader
						},
						{
							loader: require.resolve('css-loader'),
							options: {
								modules: {
									localIdentName: '[name]__[local]___[hash:base64:5]'
								},
								importLoaders: 1,
								sourceMap: true
							}
						},
						{
							loader: require.resolve('postcss-loader'),
							options: {
								sourceMap: true
							}
						},
						{
							loader: require.resolve('less-loader'),
							options: {
								sourceMap: true
							}
						}
					]
				},
				{
					test: /\.(png|jpg|gif|woff2?|svg|eot|ttf|ogg|mp3)$/,
					use: [
						{
							loader: require.resolve('file-loader'),
							options: {}
						}
					]
				},
				{
					test: /\.hbs$/,
					loader: require.resolve('handlebars-loader')
				},
				{
					test: /\.(js|jsx)$/,
					use: require.resolve('react-hot-loader/webpack'),
					include: /node_modules/
				},
				{
					test: /\.properties$/,
					use: [
						{
							loader: path.resolve(__dirname, '../utils/properties-loader.js')
						}
					]
				}
			]
		},
		resolve: {
			extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
			alias,
			fallback: { path: require.resolve('path-browserify') }
		},
		output: {
			path: path.resolve(process.cwd(), 'dist'),
			filename: '[name].[fullhash].js',
			chunkFilename: '[name].[chunkhash:8].chunk.js',
			publicPath: basePath
		},
		plugins
	};

	defaultConfig.externals = {
		/* Exports for Apps */
		react: `__ZAPP_SHARED_LIBRARIES__['react']`,
		'react-dom': `__ZAPP_SHARED_LIBRARIES__['react-dom']`,
		'react-i18next': `__ZAPP_SHARED_LIBRARIES__['react-i18next']`,
		'react-redux': `__ZAPP_SHARED_LIBRARIES__['react-redux']`,
		lodash: `__ZAPP_SHARED_LIBRARIES__['lodash']`,
		'react-router-dom': `__ZAPP_SHARED_LIBRARIES__['react-router-dom']`,
		moment: `__ZAPP_SHARED_LIBRARIES__['moment']`,
		'styled-components': `__ZAPP_SHARED_LIBRARIES__['styled-components']`,
		'@reduxjs/toolkit': `__ZAPP_SHARED_LIBRARIES__['@reduxjs/toolkit']`,
		'@zextras/carbonio-shell-ui': `__ZAPP_SHARED_LIBRARIES__['@zextras/carbonio-shell-ui']['${pkg.carbonio.name}']`,
		'@zextras/carbonio-design-system': `__ZAPP_SHARED_LIBRARIES__['@zextras/carbonio-design-system']`,
		/* Exports for App's Handlers */
		faker: `__ZAPP_SHARED_LIBRARIES__['faker']`,
		msw: `__ZAPP_SHARED_LIBRARIES__['msw']`
	};

	const confPath = path.resolve(process.cwd(), 'carbonio.webpack.js');

	if (!fs.existsSync(confPath)) {
		return defaultConfig;
	}

	const molder = require(confPath);
	return molder(defaultConfig, pkg, options, 'production');
};
