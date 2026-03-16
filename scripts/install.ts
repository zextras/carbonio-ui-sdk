/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { handler as build } from "./build";
import type { BuildOptions } from "./configs/webpack.build.config";
import { handler as deploy, type DeployOptions } from "./deploy";

const chalkTemplate = require("chalk");

type InstallOptions = BuildOptions & DeployOptions;

export const command = "install";
export const desc = "Build and deploy the project to a Carbonio instance";
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
  host: {
    desc: "Destination hostname",
    demandOption: false,
    alias: "h",
  },
  dir: {
    desc: "Destination folder",
    demandOption: false,
    alias: "f",
  },
  container: {
    desc: "Destination container",
    demandOption: false,
    alias: "c",
  },
  user: {
    desc: "Username for ssh access",
    alias: "u",
    default: "root",
  },
  port: {
    desc: "Localhost port to use",
    alias: "p",
    default: "",
  },
};

export const handler = async (options: InstallOptions) => {
  await build(options);
  await deploy(options);
  console.log(chalkTemplate.bgBlue.white.bold("Install Completed"));
};
