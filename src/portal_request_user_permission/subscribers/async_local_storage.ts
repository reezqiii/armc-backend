// request-context.ts
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  userId: number | null;
}

export const requestStorage = new AsyncLocalStorage<RequestContext>();
