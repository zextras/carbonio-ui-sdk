/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

async function bootApp() {
  const appEntrypoint = await import("app-entrypoint");

  const App = appEntrypoint?.default || appEntrypoint;
  window.__ZAPP_HMR_EXPORT__[PACKAGE_NAME](App);
}

bootApp();
