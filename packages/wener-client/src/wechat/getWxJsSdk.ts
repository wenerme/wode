import { WxJsSdk } from './WxJsSdk';

export function getWxJsSdk(): WxJsSdk {
  return globalThis.window?.wx;
}
