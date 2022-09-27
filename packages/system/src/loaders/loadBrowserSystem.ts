import { createChildLogger, loadScripts, Logger } from '@wener/utils';
import { getGlobalSystem } from '../utils/getGlobalSystem';
import { hookSystem } from './hookSystem';

export async function loadBrowserSystem({
  hooks = true,
  logger = createChildLogger(console, { m: 'SystemJS' }),
  script: _ = false,
  version = '6.12.6',
  loadSystem,
}: { hooks?: boolean; logger?: Logger; loadSystem?: () => Promise<void>; script?: boolean; version?: string } = {}) {
  if (getGlobalSystem()) {
    return getGlobalSystem();
  }
  loadSystem ||= async () => {
    // always load through scripts for now
    await loadScripts(`https://cdn.jsdelivr.net/npm/systemjs@${version}/dist/system.js`);
    await loadScripts(`https://cdn.jsdelivr.net/npm/systemjs@${version}/dist/extras/named-register.js`);
    await loadScripts(`https://cdn.jsdelivr.net/npm/systemjs@${version}/dist/extras/dynamic-import-maps.js`);
    // if (script) {
    //   // use src version
    //   // avoid minify
    //   await loadScripts(`https://cdn.jsdelivr.net/npm/systemjs@${version}/dist/system.js`);
    //   await loadScripts(`https://cdn.jsdelivr.net/npm/systemjs@${version}/dist/extras/named-register.js`);
    //   await loadScripts(`https://cdn.jsdelivr.net/npm/systemjs@${version}/dist/extras/dynamic-import-maps.js`);
    // } else {
    //   // @ts-ignore
    //   await import('systemjs/dist/system.js'); // @ts-ignore
    //   await import('systemjs/dist/extras/named-register.js'); // @ts-ignore
    //   await import('systemjs/dist/extras/dynamic-import-maps.js');
    // }
  };

  await loadSystem();
  let System = getGlobalSystem();
  if (!System) {
    throw new Error('SystemJS not loaded');
  }
  hookSystem({ System, logger, hooks });
  return System;
}
