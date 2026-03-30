/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import CopyPlugin from "copy-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { existsSync } from "node:fs";
import path from "node:path";
import webpack, { type Configuration } from "webpack";
import semver from "semver";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import CircularDependencyPlugin from "circular-dependency-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { pkg } from "../utils/pkg";

export type BuildOptions = {
  name: string;
  dev?: boolean;
  admin?: boolean;
  pkgRel?: number;
  analyze?: boolean;
  svgr?: boolean;
  useLocalDS?: boolean;
  verbose?: boolean;
};

export type BuildContext = {
  basePath: string;
  commitHash: string;
};

export const setupWebpackBuildConfig = (
  options: BuildOptions,
  { basePath, commitHash }: BuildContext
): Configuration => {
  const plugins: webpack.WebpackPluginInstance[] = [
    new webpack.DefinePlugin({
      PACKAGE_VERSION: JSON.stringify(pkg.version),
      ZIMBRA_PACKAGE_VERSION: semver.valid(semver.coerce(pkg.version)),
      PACKAGE_NAME: JSON.stringify(options.name),
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // all options are optional
      filename: "style.[chunkhash:8].css",
      chunkFilename: "[id].css",
      ignoreOrder: false, // Enable to remove warnings about conflicting order
    }),
    new HtmlWebpackPlugin({
      inject: false,
      template: path.resolve(__dirname, "./component.template"),
      filename: "component.json",
      name: options.name,
      description: pkg.description,
      version: pkg.version,
      commit: commitHash,
      priority: pkg.carbonio.priority,
      type: pkg.carbonio.type,
      attrKey: pkg.carbonio.attrKey ?? "",
      icon: pkg.carbonio.icon ?? "CubeOutline",
      display: pkg.carbonio.display,
      minify: { collapseWhitespace: false },
    }),
    new HtmlWebpackPlugin({
      inject: false,
      minify: { collapseWhitespace: false },
      template: path.resolve(__dirname, "./PKGBUILD.template"),
      filename: "package/PKGBUILD",
      name: options.name,
      description: pkg.description,
      version: pkg.version,
      commit: commitHash,
      installMode: options.admin ? "admin" : "web",
      pkgRel: options.pkgRel ?? 0,
      maintainer: "Zextras <packages@zextras.com>",
      copyright: "2022, Zextras <https://www.zextras.com>",
    }),
    new CopyPlugin({
      patterns: [
        { from: "CHANGELOG.md", to: ".", noErrorOnMissing: true },
        { from: path.resolve(__dirname, "yap.json"), to: "." },
      ],
    }),
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
        cwd: process.cwd(),
      }),
    );
  }

  const appTsxPath = path.resolve(process.cwd(), "src/app.tsx");
  const indexTsxPath = path.resolve(process.cwd(), "src/index.tsx");
  const tsxPath = existsSync(appTsxPath) ? appTsxPath : indexTsxPath;

  if (!existsSync(tsxPath)) {
    throw new Error(
      "Required entrypoint src/app.tsx or src/index.tsx not found. Please create this file to proceed.",
    );
  }

  const defaultConfig: Configuration = {
    entry: {
      app: path.resolve(__dirname, "../utils/entry"),
    },
    mode: options.dev ? "development" : "production",
    devtool: "source-map",
    target: "web",
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          loader: require.resolve("babel-loader"),
          options: {},
        },
        {
          test: /\.(less|css)$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {},
            },
            {
              loader: require.resolve("css-loader"),
              options: {
                importLoaders: 1,
                sourceMap: true,
              },
            },
            {
              loader: require.resolve("postcss-loader"),
              options: {
                sourceMap: true,
              },
            },
            {
              loader: require.resolve("less-loader"),
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.(png|jpg|gif|ogg|mp3)$/,
          type: "asset/resource",
        },
        {
          test: /\.(woff(2)?|ttf|eot)$/,
          type: "asset/resource",
        },
        {
          test: /\.hbs$/,
          loader: require.resolve("handlebars-loader"),
        },
        {
          test: /\.svg$/,
          ...(options.svgr
            ? {
                use: ["@svgr/webpack"],
              }
            : {
                type: "asset/resource",
              }),
        },
      ],
    },
    resolve: {
      extensions: ["*", ".js", ".jsx", ".ts", ".tsx"],
      alias: {
        "app-entrypoint": tsxPath,
      },
      fallback: { path: require.resolve("path-browserify") },
    },
    output: {
      path: path.resolve(process.cwd(), "dist"),
      filename: "[name].[fullhash].js",
      chunkFilename: "[name].[chunkhash:8].chunk.js",
      publicPath: basePath,
    },
    plugins,
  };

  defaultConfig.externals = {
    /* Exports for Apps */
    react: `__ZAPP_SHARED_LIBRARIES__['react']`,
    "react-dom": `__ZAPP_SHARED_LIBRARIES__['react-dom']`,
    "react-i18next": `__ZAPP_SHARED_LIBRARIES__['react-i18next']`,
    lodash: `__ZAPP_SHARED_LIBRARIES__['lodash']`,
    "react-router-dom": `__ZAPP_SHARED_LIBRARIES__['react-router-dom']`,
    "@emotion/react": `__ZAPP_SHARED_LIBRARIES__['@emotion/react']`,
    "@emotion/styled": `__ZAPP_SHARED_LIBRARIES__['@emotion/styled']`,
    "@zextras/carbonio-ui-preview": `__ZAPP_SHARED_LIBRARIES__['@zextras/carbonio-ui-preview']`,
    "@zextras/carbonio-shell-ui": `__ZAPP_SHARED_LIBRARIES__['@zextras/carbonio-shell-ui']['${options.name}']`,
    darkreader: `__ZAPP_SHARED_LIBRARIES__['darkreader']`,
    /* Exports for App's Handlers */
    msw: `__ZAPP_SHARED_LIBRARIES__['msw']`,
  };
  if (!options.useLocalDS) {
    defaultConfig.externals["@zextras/carbonio-design-system"] =
      `__ZAPP_SHARED_LIBRARIES__['@zextras/carbonio-design-system']`;
  }
  const confPath = path.resolve(process.cwd(), "carbonio.webpack.js");

  if (!existsSync(confPath)) {
    return defaultConfig;
  }

  const molder = require(confPath);
  return molder(
    defaultConfig,
    pkg,
    options,
    options.dev ? "development" : "production",
  );
};
