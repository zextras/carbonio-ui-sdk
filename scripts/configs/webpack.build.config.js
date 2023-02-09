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
const MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin');

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
		}),
		new MomentTimezoneDataPlugin({
			matchZones: [
				"Africa/Algiers",
		"America/Asuncion",
		"Africa/Cairo",
		"Africa/Casablanca",
		"Africa/Monrovia",
		"Africa/Harare",
		"Africa/Nairobi",
		"Africa/Windhoek",
		"America/Bogota",
		"America/Argentina/Buenos_Aires",
		"America/Cancun",
		"America/Caracas",
		"America/Cayenne",
		"America/Chihuahua",
		"America/Grand_Turk",
		"America/Cuiaba",
		"America/Guatemala",
		"America/Guyana",
		"America/Mexico_City",
		"America/Montevideo",
		"America/Santiago",
		"America/Tijuana",
		"Asia/Almaty",
		"Asia/Amman",
		"Asia/Baghdad",
		"Asia/Baku",
		"Asia/Bangkok",
		"Asia/Beirut",
		"Asia/Kolkata",
		"Asia/Kathmandu",
		"Asia/Colombo",
		"Asia/Damascus",
		"Asia/Dhaka",
		"Asia/Hong_Kong",
		"Asia/Irkutsk",
		"Asia/Jerusalem",
		"Asia/Kabul",
		"Asia/Karachi",
		"Asia/Krasnoyarsk",
		"Asia/Kuala_Lumpur",
		"Asia/Kuwait",
		"Asia/Magadan",
		"Asia/Muscat",
		"Asia/Novosibirsk",
		"Asia/Yangon",
		"Asia/Seoul",
		"Asia/Taipei",
		"Asia/Tashkent",
		"Asia/Tbilisi",
		"Asia/Tehran",
		"Asia/Tokyo",
		"Asia/Ulaanbaatar",
		"Asia/Pyongyang",
		"Asia/Vladivostok",
		"Asia/Yakutsk",
		"Asia/Yekaterinburg",
		"Asia/Yerevan",
		"Atlantic/Azores",
		"Atlantic/Cape_Verde",
		"Atlantic/South_Georgia",
		"Australia/Adelaide",
		"Australia/Brisbane",
		"Australia/Darwin",
		"Australia/Hobart",
		"Australia/Perth",
		"Australia/Sydney",
		"America/Sao_Paulo",
		"America/Halifax",
		"America/St_Johns",
		"America/Regina",
		"Etc/GMT+12",
		"UTC",
		"Europe/Athens",
		"Europe/Belgrade",
		"Europe/Berlin",
		"Europe/Brussels",
		"Europe/Helsinki",
		"Europe/Istanbul",
		"Europe/Kaliningrad",
		"Europe/London",
		"Europe/Minsk",
		"Europe/Moscow",
		"Europe/Warsaw",
		"Indian/Mauritius",
		"Pacific/Auckland",
		"Pacific/Fiji",
		"Pacific/Guadalcanal",
		"Pacific/Guam",
		"Pacific/Midway",
		"Pacific/Tongatapu",
		"America/Anchorage",
		"America/Phoenix",
		"America/Chicago",
		"America/Indiana/Indianapolis",
		"America/New_York",
		"Pacific/Honolulu",
		"America/Denver",
		"America/Fort_Nelson",
		"America/Los_Angeles",
		"Europe/Samara",
		"Europe/Bucharest",
		"America/Bahia",
		"Asia/Srednekolymsk",
		"Pacific/Kiritimati",
		"Africa/Tripoli",
		"Pacific/Apia",
		"Asia/Kamchatka",
		"Asia/Singapore",
		"Pacific/Bougainville",
		"America/Adak",
		"America/Araguaina",
		"America/Havana",
		"America/Miquelon",
		"America/Port-au-Prince",
		"America/Punta_Arenas",
		"Asia/Barnaul",
		"Asia/Chita",
		"Asia/Gaza",
		"Asia/Hovd",
		"Asia/Omsk",
		"Asia/Sakhalin",
		"Asia/Tomsk",
		"Australia/Eucla",
		"Australia/Lord_Howe",
		"Europe/Astrakhan",
		"Europe/Chisinau",
		"Europe/Saratov",
		"Pacific/Chatham",
		"Pacific/Easter",
		"Pacific/Marquesas",
		"Pacific/Norfolk",
		"Africa/Khartoum",
		"Africa/Sao_Tome",
		"Asia/Qyzylorda",
		"Europe/Volgograd",
		"America/Whitehorse",
		"Africa/Juba"
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
					use: [
						options.svgr ? '@svgr/webpack' : {
							loader: require.resolve('file-loader')
						}
					]
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
