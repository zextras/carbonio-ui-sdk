/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
module.exports = {
	root: true,
	// This package is a Node CLI, not a browser bundle: `scripts/` uses process,
	// __dirname and require.
	env: { es6: true, node: true },
	extends: ['./node_modules/@zextras/carbonio-ui-configs/rules/eslint.js'],
	plugins: ['eslint-plugin-notice'],
	rules: {
		'notice/notice': [
			'error',
			{
				templateFile: './notice.template.ts'
			}
		]
	},
	ignorePatterns: ['dist', 'notice.template.ts'],
	parserOptions: {
		sourceType: 'module'
	}
};
