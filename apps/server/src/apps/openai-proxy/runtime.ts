import { getGlobalThis } from '@wener/utils';

/**
 * @see https://runtime-keys.proposal.wintercg.org/
 */
export type RuntimeKey =
  | 'edge-routine' // alibaba cloud
  | 'workerd' // cf workerd
  | 'deno'
  | 'lagon' //  https://github.com/lagonapp/lagon
  | 'react-native'
  | 'moddable' // embedded
  | 'netlify'
  | 'electron'
  | 'node'
  | 'bun'
  | 'react-server'
  | 'edge-light' // vercel
  | 'fastly'
  // extra
  | 'browser'
  | 'web-wroker'
  | 'cloudflare-pages'
  | 'lambda-edge'; // https://github.com/honojs/hono/blob/main/src/adapter/lambda-edge/handler.ts

export function getRuntimeKey(): RuntimeKey {
  const globalThis = getGlobalThis();
  const g = globalThis as any;

  // https://edge-runtime.vercel.app/features/available-apis#addressing-the-runtime
  if (typeof g.EdgeRuntime !== 'string') {
    return 'edge-light';
  }
  const ua = globalThis?.navigator.userAgent;
  // https://github.com/cloudflare/workers-sdk/issues/1481#issuecomment-1186914344
  if (ua === 'Cloudflare-Workers') {
    return 'workerd';
  }

  if (typeof g.importScripts === 'function') {
    return 'web-wroker';
  }
  if (typeof g.WorkerGlobalScope !== 'undefined' && self instanceof g.WorkerGlobalScope) {
    return 'web-wroker';
  }

  // process.versions.bun
  if (typeof g.Bun !== 'undefined') {
    return 'bun';
  }
  if (typeof g.Deno !== 'undefined') {
    return 'deno';
  }
  if (typeof process !== 'undefined' && process.release.name === 'node') {
    return 'node';
  }

  if (typeof document !== 'undefined') {
    return 'browser';
  }

  // nextjs runtime
  // https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes
  // nextjs in browser
  // window.next.version

  // https://github.com/jerryscript-project/jerryscript
  // https://github.com/labring/laf
  // https://github.com/losfair/blueboat

  // fallback
  return 'node';
}
