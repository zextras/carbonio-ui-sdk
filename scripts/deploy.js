/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-console */
const { execSync } = require('child_process');
const chalkTemplate = require('chalk');
const { handler: build, builder: buildOptions } = require('./build');
const { pkg } = require('./utils/pkg');
const { commitHash } = require('./utils/setup');
const { printArgs } = require('./utils/console');

const updateJson = (appJson, carbonioJson, options) => {
  const components = carbonioJson.components.filter(
    (component) => component.name !== options.name
  );
  components.push(appJson);
  return { components };
};

exports.command = 'deploy';
exports.desc = 'Build and inject the project to a Carbonio instance';
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
  },
  buildOptions
);

exports.handler = async (options) => {
  const pathPrefix = `/opt/zextras/${options.admin ? 'admin' : 'web'}/iris/`;
  printArgs(options, 'Deploy');
  await build(options);
  if (options.host) {
    const cpTarget = `${options.user}@${options.host}`;
    const sshTarget = `${options.user}@${options.host}${
      options.port && ' -p'
    } ${options.port}`;
    console.log(`- Deploying to ${chalkTemplate.bold(sshTarget)}...`);
    execSync(
      `ssh ${sshTarget} "cd ${pathPrefix} && rm -rf ${options.name}/* && mkdir -p ${options.name}/${commitHash} ${options.name}/current"`
    );
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
