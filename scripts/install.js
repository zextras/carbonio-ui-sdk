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
exports.builder = Object.assign({
    analyze: {
      desc: 'Apply the BundleAnalyzerPlugin and launch its web ui after the compilation',
      default: false,
      boolean: true
    },
    dev: {
      desc: 'Build in devMode',
      alias: 'd',
      default: false,
      boolean: true
    },
    external: {
      desc: 'Run an additional build for external resources',
      alias: 'e',
      default: false,
      boolean: true
    },
    pkgRel: {
      desc: 'pkgRel value to pass to the PKGBUILD template',
      default: '1',
    },
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
});

exports.handler = async (options) => {
    await build(options);
    await deploy(options);
    console.log(chalkTemplate.bgBlue.white.bold('Install Completed'));
};
