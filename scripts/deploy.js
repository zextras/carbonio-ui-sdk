/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-console */
const chalkTemplate = require('chalk');
const { commitHash } = require('./utils/setup');
const { printArgs } = require('./utils/console');
const { execSync } = require('node:child_process');
const path = require('path');
const { existsSync } = require('node:fs');

const updateJson = (appJson, carbonioJson, options) => {
  const components = carbonioJson.components.filter(
    (component) => component.name !== options.name
  );
  components.push(appJson);
  return { components };
};

exports.command = 'deploy';
exports.desc = 'Deploy the project to a Carbonio instance';
exports.builder = Object.assign(
  {
    host: {
      desc: 'Destination hostname',
      demandOption: true,
      alias: 'h',
    },
    user: {
      desc: 'Username for ssh access',
      alias: 'u',
      default: 'root',
    },
    port: {
      desc: 'Localhost port to use',
      alias: 'p',
      default: '',
    },
  }
);

exports.handler = async (options) => {
  const pathPrefix = `/opt/zextras/${options.admin ? 'admin' : 'web'}/iris/`;
  printArgs(options, 'Deploy');
  const distPath = path.resolve(process.cwd(), 'dist');
  if (!existsSync(distPath)) {
      console.log(
          chalkTemplate.red(
              'Missing dist folder, skipping deploy step. Run build step before'
          )
      );
      return;
  }
  if (options.host) {
    const cpTarget = `${options.user}@${options.host}`;
    const sshTarget = `${options.user}@${options.host}${
      options.port && ' -p'
    } ${options.port}`;
    console.log(`- Deploying to ${chalkTemplate.bold(sshTarget)}...`);
    execSync(`ssh ${sshTarget} '
        find ${pathPrefix}${options.name} -mindepth 1 -name i18n -prune -o -exec rm -rf {} + &&
        cd ${pathPrefix} && mkdir -p ${options.name}/${commitHash} ${options.name}/current &&
        ln -sf ${pathPrefix}${options.name}/i18n "${pathPrefix}${options.name}/${commitHash}/i18n"
    '`);

    execSync(
        `scp -r ${options.port && '-P'} ${
            options.port
        } dist/* ${cpTarget}:${pathPrefix}${options.name}/${commitHash}`
    );
    console.log(`- Updating ${chalkTemplate.bold('components.json')}...`);
    const components = JSON.stringify(
      updateJson(
        JSON.parse(
            execSync(
                `ssh ${sshTarget} cat ${pathPrefix}${options.name}/${commitHash}/component.json`
            ).toString()
        ),
        JSON.parse(
            execSync(
                `ssh ${sshTarget} cat ${pathPrefix}components.json`
            ).toString()
        ),
        options
      )
    ).replace(/"/g, '\\"');
    execSync(
      `ssh ${sshTarget} "echo '${components}' > ${pathPrefix}components.json"`
    );
    console.log(`- Updating html indexes...`);
    execSync(
      `ssh ${sshTarget} "cd ${pathPrefix}${options.name}/${commitHash} && find . -name \"*.html\" -exec cp --parents \"{}\" ${pathPrefix}${options.name}/current/ \\;"`
    );
    console.log(chalkTemplate.bgBlue.white.bold('Deploy Completed'));
  } else {
    console.log(
      chalkTemplate.bgYellow.white(
        'Target host not specified, skipping deploy step'
      )
    );
  }
};
