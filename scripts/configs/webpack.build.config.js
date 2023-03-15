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
const CircularDependencyPlugin = require('circular-dependency-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { createBabelConfig } = require('./babelrc.build.js');
const { pkg } = require('../utils/pkg.js');

exports.setupWebpackBuildConfig = (options, { basePath, commitHash }, skipCustomization = false) => {
	const plugins = [
		new webpack.DefinePlugin({
			PACKAGE_VERSION: JSON.stringify(pkg.version),
			ZIMBRA_PACKAGE_VERSION: semver.valid(semver.coerce(pkg.version)),
			PACKAGE_NAME: JSON.stringify(options.name)
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
			name: options.name ?? options.name,
			description: pkg.description,
			version: pkg.version,
			commit: commitHash,
			priority: pkg.carbonio.priority,
			type: pkg.carbonio.type,
			attrKey: pkg.carbonio.attrKey ?? '',
			icon: pkg.carbonio.icon ?? 'CubeOutline',
			display: pkg.carbonio.display,
			sentryDsn: pkg.carbonio.sentryDsn,
			minify: { collapseWhitespace: false }
		}),
		new HtmlWebpackPlugin({
			inject: false,
			minify: { collapseWhitespace: false },
			template: path.resolve(__dirname, './PKGBUILD.template'),
			filename: 'PKGBUILD',
			name: options.name ?? options.name,
			description: pkg.description,
			version: pkg.version,
			commit: commitHash,
			installMode: (options.admin) ? 'admin' : 'web',
			pkgRel: options.pkgRel ?? 0,
			maintainer: 'Zextras <packages@zextras.com>'
		}),
		new CopyPlugin({
			patterns: [
				{ from: 'translations', to: 'i18n' },
				{ from: 'CHANGELOG.md', to: '.', noErrorOnMissing: true },
				{ from: path.resolve(__dirname, 'pacur.json'), to: '.'}
			]
		})
	];
	if (options.analyze) {
		plugins.push(
			new BundleAnalyzerPlugin(),
			new CircularDependencyPlugin({
				// exclude detection of files based on a RegExp
				exclude: /node_modules/,
				// add errors to webpack instead of warnings
				failOnError: false,
				// allow import cycles that include an asynchronous import,
				// e.g. via import(/* webpackMode: "weak" */ './file.js')
				allowAsyncCycles: true,
				// set the current working directory for displaying module paths
				cwd: process.cwd()
			})
		);
	}

	const defaultConfig = {
		entry: {
			app: path.resolve(__dirname, '../utils/entry.js')
		},
		mode: options.dev ? 'development' : 'production',
		devtool: 'source-map',
		target: 'web',
		module: {
			rules: [
				{
					test: /\.[jt]sx?$/,
					exclude: /node_modules/,
					loader: require.resolve('babel-loader'),
					options: createBabelConfig(`babel.config.js`)
				},
				{
					test: /\.(less|css)$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader,
							options: {}
						},
						{
							loader: require.resolve('css-loader'),
							options: {
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
					test: /\.(png|jpg|gif|ogg|mp3)$/,
					type: 'asset/resource'
				},
				{
					test: /\.(woff(2)?|ttf|eot)$/,
					type: 'asset/resource'
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
				},
				{
					test: /\.svg$/,
					type: 'asset/resource'
				}
			]
		},
		resolve: {
			extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
			alias: {
				"app-entrypoint": path.resolve(process.cwd(), 'src/app.jsx')
			},
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
		'@zextras/carbonio-ui-preview': `__ZAPP_SHARED_LIBRARIES__['@zextras/carbonio-ui-preview']`,
		'@zextras/carbonio-shell-ui': `__ZAPP_SHARED_LIBRARIES__['@zextras/carbonio-shell-ui']['${options.name}']`,
		/* Exports for App's Handlers */
		msw: `__ZAPP_SHARED_LIBRARIES__['msw']`
	};
	if (!options.useLocalDS) {
		defaultConfig.externals[
			'@zextras/carbonio-design-system'
		] = `__ZAPP_SHARED_LIBRARIES__['@zextras/carbonio-design-system']`;
	}
	const confPath = path.resolve(process.cwd(), 'carbonio.webpack.js');

	if (!fs.existsSync(confPath) || skipCustomization) {
		return defaultConfig;
	}

	const molder = require(confPath);
	return molder(defaultConfig, pkg, options, options.dev ? 'development' : 'production');
};
