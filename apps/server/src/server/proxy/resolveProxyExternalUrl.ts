export function resolveProxyExternalUrl(target: string | URL | undefined | null) {
  if (!target) return undefined;

  let u: URL;
  if (typeof target === 'string') {
    try {
      let url = target.includes('.') ? target : atob(target);
      /^https?:\/\//.test(url) || (url = `https://${url}`);
      u = new URL(url);
    } catch (e) {
      console.warn(`resolveExternalUrl: Invalid URL: ${target}`);
      return undefined;
    }
  } else {
    u = target;
  }

  u.protocol = 'https:';
  let valid = [
    // Tencent CDN
    // ===============
    'https://wx.qlogo.cn/mmhead/',
    // 'https://wework.qpic.cn/wwpic/',
    // 'https://wework.qpic.cn/wwpic3az/',
    'https://wework.qpic.cn/wwpic',
    'https://wework.qpic.cn/wwhead/',
    // link image url
    'https://wwcdn.weixin.qq.com/node/wework/images/',
    // qpic.cn
    // 'https://mmbiz.qpic.cn/mmbiz_jpg/',
    // 'https://mmbiz.qpic.cn/mmbiz_svg/',
    // 'https://mmbiz.qpic.cn/mmbiz_png/',
    // 'https://mmbiz.qpic.cn/sz_mmbiz_png',
    'https://mmbiz.qpic.cn',
    // 无法下载
    'https://imunion.weixin.qq.com/cgi-bin/mmae-bin/',
    // Tech
    'https://github.com',
    // https://github.com/hunshcn/gh-proxy
    // https://ghp.ci/
    'https://raw.githubusercontent.com',
    'https://gist.github.com',
    'https://gist.githubusercontent.com',
  ];
  if (!valid.some((v) => u.href.startsWith(v))) {
    console.warn(`resolveExternalUrl: Invalid URL: ${u.href}`);
    return undefined;
  }
  return {
    url: u.toString(),
  };
}
