/**
 * 当前是否在微信中
 */
export function isWeChatUserAgent(ua: string = globalThis.navigator?.userAgent) {
  return ua?.includes('MicroMessenger');
}

/**
 * 当前是否为 微信小程序
 */
export function isMiniProgramUserAgent(ua?: string) {
  if (!ua) {
    if (typeof window === 'undefined') {
      return false;
    }
    if ((window as any).__wxjs_environment === 'miniprogram') {
      return true;
    }
    ua = window.navigator.userAgent;
  }
  // https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html
  return ua.includes('miniProgram');
}
