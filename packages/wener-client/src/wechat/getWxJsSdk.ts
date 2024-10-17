import type { WxJsSdk } from './WxJsSdk';

export function getWxJsSdk(): WxJsSdk {
  return globalThis.window?.wx;
}
