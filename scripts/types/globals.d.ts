declare const PACKAGE_NAME: string;

declare const module: {
  hot?: {
    accept: (dependency: string, callback: () => void) => void;
  };
};

interface Window {
  __ZAPP_HMR_EXPORT__: Record<string, (app: unknown) => void>;
}

declare module "app-entrypoint";

declare module "node-http-proxy-json" {
  import type { IncomingMessage, ServerResponse } from "node:http";

  const modifyResponse: (
    res: ServerResponse,
    proxyRes: IncomingMessage | String | undefined,
    transform: (body: any) => any,
  ) => void;

  export = modifyResponse;
}
