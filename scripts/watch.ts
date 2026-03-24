/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
  setupWebpackWatchConfig,
  type WatchOptions,
} from "./configs/webpack.watch.config";
import webpack from "webpack";
import { commitHash } from "./utils/setup";
import WebpackDevServer from "webpack-dev-server";
import { printArgs } from "./utils/console";
import { styleText } from "node:util";

export const command = "watch";
export const desc =
  "Run the project in watch mode, proxying against a Carbonio instance";
export const aliases = ["start"];
export const builder = {
  host: {
    desc: "Destination hostname",
    demandOption: true,
    alias: "h",
  },
  port: {
    desc: "localhost port to use",
    alias: "p",
    default: "9000",
  },
  standalone: {
    desc: "Only load the current module",
    alias: "s",
    default: false,
    boolean: true,
  },
  useLocalDS: {
    desc: "Use the local DS module instead of the one provided by the remote shell",
    alias: "u",
    default: false,
    boolean: true,
  },
  ws: {
    desc: "Enable websocket proxy",
    alias: "w",
    default: false,
    boolean: true,
  },
};

export const handler = async (options: WatchOptions) => {
  printArgs(options, "Watch");
  const basePath = `/static/iris/${options.name}/${commitHash}/`;
  console.log("Building ", styleText(["green", "bold"], options.name));
  console.log("Using base path ", styleText(["green", "bold"], basePath));
  const config = setupWebpackWatchConfig(options, { basePath, commitHash });
  const compiler = webpack(config);
  const server = new WebpackDevServer(config.devServer ?? {}, compiler);
  const runServer = async () => {
    console.log(styleText(["blue", "bold"], "Starting server..."));
    await server.start();
  };
  return runServer();
};
