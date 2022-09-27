import { createChildLogger, Logger } from '@wener/utils';
import { instantiatePackageProtocol } from '../hooks/instantiatePackageProtocol';
import { resolveBareSpecifier } from '../hooks/resolveBareSpecifier';
import { getGlobalSystem } from '../utils/getGlobalSystem';

export async function loadServerSystem({
  hook = true,
  logger = createChildLogger(console, { m: 'SystemJS' }),
  loadSystem,
}: { hook?: boolean; logger?: Logger; loadSystem?: () => Promise<void> } = {}) {
  if (getGlobalSystem()) {
    return getGlobalSystem();
  }
  // if (typeof window !== 'undefined') {
  //   return loadBrowserSystem();
  // }
  loadSystem ||= async () => {
    if (typeof globalThis.fetch === 'undefined') {
      const { default: fetch } = await import('node-fetch');
      const { Response, Headers, Request, AbortError, FetchError, FormData, Blob, File } = await import('node-fetch');
      Object.assign(globalThis, {
        fetch,
        Response,
        Headers,
        Request,
        AbortError,
        FetchError,
        FormData,
        Blob,
        File,
      });
    }

    const {
      default: { applyImportMap, setBaseUrl },
      // @ts-ignore
    } = await import('systemjs/dist/system-node.cjs'); // @ts-ignore
    await import('systemjs/dist/extras/named-register.js'); // @ts-ignore
    await import('systemjs/dist/extras/module-types.js');

    let System = getGlobalSystem();
    System.constructor.prototype.applyImportMap = (...args: any[]) => applyImportMap(System, ...args);
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
  if (hook) {
    resolveBareSpecifier({ System, logger: createChildLogger(logger, { c: 'resolveBareSpecifier' }) });
    instantiatePackageProtocol({ System, logger: createChildLogger(logger, { c: 'instantiatePackageProtocol' }) });
  }
  return System;
}
