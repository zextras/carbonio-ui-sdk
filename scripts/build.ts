/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import chalk from "chalk";
import {
  setupWebpackBuildConfig,
  type BuildOptions,
} from "./configs/webpack.build.config";
import webpack from "webpack";
import { commitHash } from "./utils/setup";
import { logBuild, printArgs } from "./utils/console";
import { rmSync } from "node:fs";

export const command = "build";
export const desc = "Compile and bundle your project";
export const builder = {
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

export const handler = async (options: BuildOptions) =>
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
