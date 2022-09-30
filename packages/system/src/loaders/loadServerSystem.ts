import { createChildLogger, Logger } from '@wener/utils';
import { polyfillFetch } from '@wener/utils/server';
import { getGlobalSystem } from '../utils/getGlobalSystem';
import { hookSystem, SystemHookOption } from './hookSystem';

export async function loadServerSystem({
  hooks = true,
  logger = createChildLogger(console, { m: 'SystemJS' }),
  loadSystem,
}: { hooks?: boolean | Array<SystemHookOption>; logger?: Logger; loadSystem?: () => Promise<void> } = {}) {
  if (getGlobalSystem()) {
    return getGlobalSystem();
  }
  // if (typeof window !== 'undefined') {
  //   return loadBrowserSystem();
  // }
  loadSystem ||= async () => {
    // polyfill fetch to make module-types works
    await polyfillFetch();

    const {
      default: { applyImportMap, setBaseUrl },
      // @ts-ignore
    } = await import('systemjs/dist/system-node.cjs'); // @ts-ignore
    await import('systemjs/dist/extras/named-register.js'); // @ts-ignore
    await import('systemjs/dist/extras/module-types.js');

    let System = getGlobalSystem();
    System.constructor.prototype.addImportMap ||= (...args: any[]) => applyImportMap(System, ...args);
    System.constructor.prototype.setBaseUrl = (u: string) => setBaseUrl(System, u);
  };

  await loadSystem();
  let System = getGlobalSystem();
  if (!System) {
    throw new Error('SystemJS not loaded');
  }

  // fix for https://github.com/systemjs/systemjs/issues/2426
  const orig = System.constructor.prototype.shouldFetch;
  System.constructor.prototype.shouldFetch = (url: string) => {
    return orig(url) || url.startsWith('https://');
  };
  hookSystem({ System, logger, hooks });
  return System;
}
