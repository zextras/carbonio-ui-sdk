/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const { readFileSync } = require("node:fs");
const path = require("path");

export type CarbonioPkg = {
  name: string;
  version: string;
  description: string;
  carbonio: {
    name?: string;
    type: string;
    priority: number;
    attrKey?: string;
    icon?: string;
    display: string;
  };
  sdk?: {
    svgr?: boolean;
  };
};

exports.pkg = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"),
) as CarbonioPkg;
