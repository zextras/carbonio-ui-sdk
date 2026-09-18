/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
declare const PACKAGE_NAME: string;

declare const module: {
	hot?: {
		accept: (dependency: string, callback: () => void) => void;
	};
};

interface Window {
	__ZAPP_HMR_EXPORT__: Record<string, (app: unknown) => void>;
}

declare module 'app-entrypoint';

declare module 'node-http-proxy-json' {
	import type { IncomingMessage, ServerResponse } from 'node:http';

	const modifyResponse: (
		res: ServerResponse,
		proxyRes: IncomingMessage | string | undefined,
		// The library hands over an arbitrary JSON body and accepts either an object
		// or a string back, so `any` is what this untyped dependency actually offers.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		transform: (body: any) => any
	) => void;

	export = modifyResponse;
}
