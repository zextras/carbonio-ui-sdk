/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const { handler: build } = require('./build');
const { handler: deploy } = require('./deploy');
const chalkTemplate = require('chalk');

exports.command = 'install';
exports.desc = 'Build and deploy the project to a Carbonio instance';
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
  await build(options);
  await deploy(options);
  console.log(chalkTemplate.bgBlue.white.bold('Install Completed'));
};
