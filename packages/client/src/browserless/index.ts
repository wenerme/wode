import puppeteer from 'puppeteer-core';

interface BrowserlessEndpointOptions {
  url: string;
  token?: string;
  proxy?: string;
  blockAds?: boolean;
  ignoreDefaultArgs?: boolean;
  ttl?: number;
  launch?: {
    args?: string[];
    stealth?: boolean;
    headless?: boolean;
    timeout?: number;
  };
}

/**
 * @see https://docs.browserless.io/chrome-flags
 */
export function buildBrowserlessEndpointUrl({ url, ...rest }: BrowserlessEndpointOptions) {
  let u = new URL(url);

  for (let [k, v] of Object.entries(rest)) {
    if (v === undefined || v === null) {
      continue;
    }
    switch (typeof v) {
      case 'string':
        u.searchParams.set(k, v.toString());
        break;
      default:
        u.searchParams.set(k, JSON.stringify(v));
        break;
    }
  }
  return u.toString();
}

export function connect({ endpoint }: { endpoint: BrowserlessEndpointOptions }) {
  return puppeteer.connect({
    browserWSEndpoint: buildBrowserlessEndpointUrl(endpoint),
    // 1280x720
    defaultViewport: { width: 1265, height: 617 },
  });
}
