/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Configuration as DevServerConfiguration } from "webpack-dev-server";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  type BuildOptions,
  type BuildContext,
  setupWebpackBuildConfig,
} from "./webpack.build.config";
import { Configuration } from "webpack";
import path from "node:path";
import { existsSync } from "node:fs";
import { pkg } from "../utils/pkg";
import modifyResponse from "node-http-proxy-json";
import { styleText } from "node:util";

export type WatchOptions = BuildOptions & {
  host: string;
  port?: number;
  ws?: boolean;
  standalone?: boolean;
};

type WatchConfiguration = Configuration & {
  devServer?: DevServerConfiguration;
};

export const setupWebpackWatchConfig = (
  options: WatchOptions,
  { basePath, commitHash }: BuildContext,
): WatchConfiguration => {
  const defaultConfig = setupWebpackBuildConfig(
    options,
    { basePath, commitHash }
  ) as WatchConfiguration;
  const server = `https://${options.host}/`;
  const devServerPort = options.port ?? 9000;
  const localhost = `localhost:${devServerPort}`;
  let serverZappCommitHash: string | undefined;
  defaultConfig.mode = "development";
  if (defaultConfig.output) {
    defaultConfig.output.filename = "[name].bundle.js";
    defaultConfig.output.chunkFilename = "[name].chunk.js";
  }
  defaultConfig.devServer = {
    liveReload: true,
    port: devServerPort,
    historyApiFallback: {
      index: basePath,
    },
    server: "https",
    setupMiddlewares: (middlewares) => {
      middlewares.unshift({
        path: "/_cli",
        middleware: (req: any, res: any) => {
          res.json({
            isWatch: true,
            isStandalone: !!options.standalone,
            server: server,
            app_package: {
              package: options.name,
              name: options.name,
              version: pkg.version,
              description: pkg.description,
            },
          });
        },
      });

      return middlewares;
    },
    open: [`https://localhost:${devServerPort}/${pkg.carbonio.type}/`],
    proxy: [
      {
        context: [
          `!${basePath}/**/*`,
          "!/static/iris/components.json",
          `!/static/iris/${options.name}/${commitHash}/i18n/*.json`,
        ],
        target: server,
        secure: false,
        logLevel: "debug",
        ws: options.ws ?? false,
        cookieDomainRewrite: {
          "*": server,
          [server]: localhost,
        },
      },
      {
        context: ["/static/iris/components.json"],
        target: server,
        secure: false,
        logLevel: "debug",
        ws: options.ws ?? false,
        cookieDomainRewrite: {
          "*": server,
          [server]: localhost,
        },
        selfHandleResponse: false,
        onProxyRes(
          proxyRes: IncomingMessage,
          req: IncomingMessage,
          res: ServerResponse,
        ) {
          modifyResponse(res, proxyRes, function (body: any) {
            if (body?.components) {
              console.log(
                styleText(
                  ["green", "bold"],
                  "[Proxy] modifying components.json",
                ),
              );
              let found = false;
              const components = body.components.reduce(
                (acc: any, module: any) => {
                  if (module.name === options.name) {
                    serverZappCommitHash = module.commit;
                    found = true;
                    return [
                      ...acc,
                      { ...module, js_entrypoint: `${basePath}app.bundle.js` },
                    ];
                  }
                  if (options.standalone) {
                    return acc;
                  }
                  return [...acc, module];
                },
                [],
              );
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
                });
              }
              return JSON.stringify({ components });
            }
            console.log(
              styleText(
                ["green", "bold"],
                "[Proxy] components.json: no content",
              ),
            );
            return body;
          });
        },
      },
      {
        context: [`/static/iris/${options.name}/${commitHash}/i18n/*.json`],
        target: server,
        secure: false,
        logLevel: "debug",
        ws: options.ws ?? false,
        cookieDomainRewrite: {
          "*": server,
          [server]: localhost,
        },
        pathRewrite: (urlPath: string): string => {
          return urlPath.replace(
            commitHash,
            serverZappCommitHash ?? commitHash,
          );
        },
      },
    ],
  };

  const mtsConfPath = path.resolve(process.cwd(), "carbonio.webpack.mts");
  const tsConfPath = path.resolve(process.cwd(), "carbonio.webpack.ts");
  const jsConfPath = path.resolve(process.cwd(), "carbonio.webpack.js");
  const confPath = existsSync(mtsConfPath) ? mtsConfPath : existsSync(tsConfPath) ? tsConfPath : existsSync(jsConfPath) ? jsConfPath : undefined;

  if (!confPath) {
    return defaultConfig;
  }

  const imported = require(confPath);
  const molder = imported.default ?? imported;
  return molder(defaultConfig, pkg, options, "development");
};
