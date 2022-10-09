import type { Logger } from '@wener/utils';
import { createChildLogger, loadScripts } from '@wener/utils';
import { getGlobalSystem } from '../utils/getGlobalSystem';
import type { SystemHookOption } from './hookSystem';
import { hookSystem } from './hookSystem';

let _loading: Promise<any>;

export function loadBrowserSystem({
  hooks = true,
  logger = createChildLogger(console, { m: 'SystemJS' }),
  script = true,
  version = '6.13.0',
  loadSystem,
}: {
  hooks?: boolean | Array<SystemHookOption>;
  logger?: Logger;
  loadSystem?: () => Promise<void>;
  script?: boolean;
  version?: string;
} = {}) {
  if (getGlobalSystem()) {
    return Promise.resolve(getGlobalSystem());
  }
  _loading ||= Promise.resolve().then(async () => {
    loadSystem ||= async () => {
      const loadScript = async () => {
        logger.debug(`load systemjs ${version} through script`);
        await loadScripts(`https://cdn.jsdelivr.net/npm/systemjs@${version}/dist/system.js`);
        await loadScripts(`https://cdn.jsdelivr.net/npm/systemjs@${version}/dist/extras/named-register.js`);
        await loadScripts(`https://cdn.jsdelivr.net/npm/systemjs@${version}/dist/extras/dynamic-import-maps.js`);
      };
      if (process.env.NODE_ENV === 'production') {
        // always load through scripts for now
        await loadScript();
      } else {
        if (script) {
          await loadScript();
        } else {
          logger.debug(`load systemjs through import`);
          // @ts-expect-error
          await import('systemjs/dist/system.js');
          // @ts-expect-error
          await import('systemjs/dist/extras/named-register.js');
          // @ts-expect-error
          await import('systemjs/dist/extras/dynamic-import-maps.js');
        }
        if (typeof window !== 'undefined') {
          // @ts-expect-error
          globalThis.System ??= window.System;
        }
      }

      const System = getGlobalSystem();
      // fix for https://github.com/systemjs/systemjs/issues/2426
      const orig = System.constructor.prototype.shouldFetch;
      // otherwise will fall back to script-load
      System.constructor.prototype.shouldFetch = (url: string) => {
        return orig(url) || url.startsWith('https://');
      };
    };

    await loadSystem();
    const System = getGlobalSystem();
    if (!System) {
      throw new Error('SystemJS not loaded');
    }
    hookSystem({ System, logger, hooks });
    return System;
  });
  return _loading;
}
