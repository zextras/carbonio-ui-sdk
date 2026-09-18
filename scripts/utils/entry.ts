/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

async function bootApp(): Promise<void> {
	// 'app-entrypoint' is a webpack alias pointing at the consumer project's entry
	// file (see resolve.alias in webpack.build.config.ts): it has no path on disk.
	// eslint-disable-next-line import/no-unresolved
	const appEntrypoint = await import('app-entrypoint');

	const App = appEntrypoint?.default || appEntrypoint;
	window.__ZAPP_HMR_EXPORT__[PACKAGE_NAME](App);
}

bootApp();
