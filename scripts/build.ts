/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { BuildOptions } from "./configs/webpack.build.config";

const chalk = require("chalk");
const webpack = require("webpack");
const { commitHash } = require("./utils/setup");
const { setupWebpackBuildConfig } = require("./configs/webpack.build.config");

const { logBuild, printArgs } = require("./utils/console");
const { rmSync } = require("node:fs");

exports.command = "build";
exports.desc = "Compile and bundle your project";
exports.builder = {
  analyze: {
    desc: "Apply the BundleAnalyzerPlugin and launch its web ui after the compilation",
    default: false,
    boolean: true,
  },
  dev: {
    desc: "Build in devMode",
    alias: "d",
    default: false,
    boolean: true,
  },
  pkgRel: {
    desc: "pkgRel value to pass to the PKGBUILD template",
    default: "1",
  },
};

exports.handler = async (options: BuildOptions) =>
  new Promise(async (...p) => {
    printArgs(options, "Build");
    const basePath = `/static/iris/${options.name}/${commitHash}/`;
    rmSync("dist", { recursive: true, force: true });
    console.log("Building ", chalk.green(options.name));
    console.log("Using base path ", chalk.green(basePath));
    const config = setupWebpackBuildConfig(options, { basePath, commitHash });
    const compiler = webpack(config);
    compiler.run(logBuild(p, options));
  });
