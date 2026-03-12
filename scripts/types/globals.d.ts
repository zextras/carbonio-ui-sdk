declare const PACKAGE_NAME: string;
declare const HAS_HANDLERS: boolean;

declare const module: {
  hot?: {
    accept: (dependency: string, callback: () => void) => void;
  };
};

interface Window {
  __ZAPP_HMR_EXPORT__: Record<string, (app: unknown) => void>;
  __ZAPP_HMR_HANDLERS__: Record<string, (handlers: unknown) => void>;
}

declare module "app-entrypoint";
declare module "app-handlers";

declare module "node-http-proxy-json" {
  import type { IncomingMessage, ServerResponse } from "node:http";

  const modifyResponse: (
    res: ServerResponse,
    proxyRes: IncomingMessage,
    transform: (body: unknown) => unknown,
  ) => void;

  export = modifyResponse;
}
