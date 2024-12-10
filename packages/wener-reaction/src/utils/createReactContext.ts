import { createContext, type Context } from 'react';
import { getGlobalStates } from '@wener/utils';

/**
 * Create a React Context with a global state, will keep the same context in development mode with HMR.
 */
export function createReactContext<T>(name: string, defaultValue: T): Context<T> {
  if (process.env.NODE_ENV === 'development') {
    const g = getGlobalStates<Record<string, any>>('ReactContext', () => {
      return {};
    });
    let ctx = g[name] as Context<T>;
    if (!ctx) {
      ctx = createContext(defaultValue);
      ctx.displayName = name;
      g[name] = ctx;
    }
    return ctx;
  }
  return createContext(defaultValue);
}
