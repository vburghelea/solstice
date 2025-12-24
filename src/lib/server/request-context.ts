import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  requestId: string;
  headers: Headers;
};

const storage = new AsyncLocalStorage<RequestContext>();

export const runWithRequestContext = <T>(ctx: RequestContext, fn: () => T): T =>
  storage.run(ctx, fn);

export const getRequestContext = (): RequestContext | undefined => storage.getStore();
