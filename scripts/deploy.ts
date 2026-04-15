/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import path from "node:path";
import { printArgs } from "./utils/console";
import { commitHash } from "./utils/setup";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { styleText } from "node:util";

export type DeployOptions = {
  name: string;
  admin?: boolean;
  verbose?: boolean;
  host?: string;
  dir?: string;
  container?: string;
  user: string;
  port?: string;
};

type ComponentEntry = {
  name: string;
  commit: string;
  description: string;
  priority: number;
  version: string;
  type: string;
  attrKey?: string;
  icon?: string;
  display: string;
  js_entrypoint?: string;
};

type ComponentsJson = {
  components: ComponentEntry[];
};

const updateJson = (
  appJson: ComponentEntry,
  carbonioJson: ComponentsJson,
  options: Pick<DeployOptions, "name">,
): ComponentsJson => {
  const components = carbonioJson.components.filter(
    (component) => component.name !== options.name,
  );
  components.push(appJson);
  return { components };
};

export const command = "deploy";
export const desc = "Deploy the project to a Carbonio instance";
export const builder = {
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

export const handler = async (options: DeployOptions) => {
  const pathPrefix = `/opt/zextras/${options.admin ? "admin" : "web"}/iris/`;
  printArgs(options, "Deploy");
  const distPath = path.resolve(process.cwd(), "dist");
  if (!existsSync(distPath)) {
    console.log(
      styleText(
        ["red", "bold"],
        "Missing dist folder, skipping deploy step. Run build step before",
      ),
    );
    return;
  }

  if (!options.host && !options.dir && !options.container) {
    console.log(
      styleText(
        ["red", "bold"],
        "No target (host, directory or container) specified, skipping deploy step",
      ),
    );
    return;
  }

  /**
   * Remote server deploy
   */
  if (options.host) {
    const cpTarget = `${options.user}@${options.host}`;
    const sshTarget = `${options.user}@${options.host}${
      options.port && " -p"
    } ${options.port}`;
    console.log(
      `- Deploying to server ${styleText(["blue", "bold"], sshTarget)}...`,
    );
    execSync(`ssh ${sshTarget} '
        find ${pathPrefix}${options.name} -mindepth 1 -name i18n -prune -o -exec rm -rf {} + &&
        cd ${pathPrefix} && mkdir -p ${options.name}/${commitHash} ${options.name}/current &&
        ln -sf ${pathPrefix}${options.name}/i18n "${pathPrefix}${options.name}/${commitHash}/i18n"
    '`);

    execSync(
      `scp -r ${options.port && "-P"} ${
        options.port
      } dist/* ${cpTarget}:${pathPrefix}${options.name}/${commitHash}`,
    );
    console.log(
      `- Updating ${styleText(["blue", "bold"], "components.json")}...`,
    );
    const components = JSON.stringify(
      updateJson(
        JSON.parse(
          execSync(
            `ssh ${sshTarget} cat ${pathPrefix}${options.name}/${commitHash}/component.json`,
          ).toString(),
        ),
        JSON.parse(
          execSync(
            `ssh ${sshTarget} cat ${pathPrefix}components.json`,
          ).toString(),
        ),
        options,
      ),
    ).replace(/"/g, '\\"');
    execSync(
      `ssh ${sshTarget} "echo '${components}' > ${pathPrefix}components.json"`,
    );
    console.log(`- Updating html indexes...`);
    execSync(
      `ssh ${sshTarget} "cd ${pathPrefix}${options.name}/${commitHash} && find . -name \"*.html\" -exec cp --parents \"{}\" ${pathPrefix}${options.name}/current/ \\;"`,
    );
    console.log(styleText(["blue", "bold"], "Deploy Completed"));
  }

  /**
   * Local directory deploy
   */
  if (options.dir) {
    // Check if target directory exists
    if (!existsSync(options.dir)) {
      console.log(
        styleText(
          ["red", "bold"],
          `Target directory ${styleText(["blue", "bold"], options.dir)} does not exist, skipping deploy step`,
        ),
      );
      return;
    }

    console.log(
      `- Deploying to local directory ${styleText(["blue", "bold"], options.dir)}...`,
    );

    execSync(`
        find ${options.dir}/${options.name} -mindepth 1 -name i18n -prune -o -exec rm -rf {} + &&
        cd ${options.dir} && mkdir -p ${options.name}/${commitHash} ${options.name}/current &&
        cd ${options.dir}/${options.name}/${commitHash} &&
        ln -sf "../i18n" "i18n"
    `);
    execSync(`cp -r dist/* ${options.dir}/${options.name}/${commitHash}`);

    console.log(
      `- Updating ${styleText(["blue", "bold"], "components.json")}...`,
    );
    const components = JSON.stringify(
      updateJson(
        JSON.parse(
          execSync(
            `cat ${options.dir}/${options.name}/${commitHash}/component.json`,
          ).toString(),
        ),
        JSON.parse(execSync(`cat ${options.dir}/components.json`).toString()),
        options,
      ),
    );
    execSync(`echo '${components}' > ${options.dir}/components.json`);
    console.log(`- Updating html indexes...`);
    execSync(
      `cd ${options.dir}/${options.name}/${commitHash} && find . -name \"*.html\" -exec cp --parents \"{}\" ${options.dir}/${options.name}/current/ \\;`,
    );
    console.log(styleText(["blue", "bold"], "Deploy Completed"));
  }

  /**
   * Container deploy
   */
  if (options.container) {
    console.log(
      `- Deploying to container ${styleText(["blue", "bold"], options.container)}...`,
    );
    execSync(`docker exec ${options.container} sh -c '
        find ${pathPrefix}${options.name} -mindepth 1 -name i18n -prune -o -exec rm -rf {} + &&
        cd ${pathPrefix} && mkdir -p ${options.name}/${commitHash} ${options.name}/current &&
        cd ${options.name}/${commitHash} &&
        ln -sf "../i18n" "i18n"
    '`);

    execSync(
      `docker cp dist/. ${options.container}:${pathPrefix}${options.name}/${commitHash}`,
    );
    console.log(
      `- Updating ${styleText(["blue", "bold"], "components.json")}...`,
    );
    const components = JSON.stringify(
      updateJson(
        JSON.parse(
          execSync(
            `docker exec ${options.container} sh -c "cat ${pathPrefix}${options.name}/${commitHash}/component.json"`,
          ).toString(),
        ),
        JSON.parse(
          execSync(
            `docker exec ${options.container} sh -c "cat ${pathPrefix}components.json"`,
          ).toString(),
        ),
        options,
      ),
    ).replace(/"/g, '\\"');
    execSync(
      `docker exec ${options.container} sh -c "echo '${components}' > ${pathPrefix}components.json"`,
    );
    console.log(`- Updating html indexes...`);
    execSync(
      `docker exec ${options.container} sh -c "cd ${pathPrefix}${options.name}/${commitHash} && find . -name \"*.html\" -exec cp --parents \"{}\" ${pathPrefix}${options.name}/current/ \\;"`,
    );
    console.log(styleText(["blue", "bold"], "Deploy Completed"));
  }
};
