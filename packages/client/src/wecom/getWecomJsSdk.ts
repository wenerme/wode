export type WecomSdk = typeof import('@wecom/jssdk');

export function getWecomJsSdk() {
  return globalThis.window?.ww;
}

declare global {
  interface Window {
    ww: WecomSdk;
  }
}
