import { FetchLike } from '@wener/utils';

export interface VerifyOptions {
  fetch?: FetchLike;
  proxy?: string;
}

export interface VerifyResult {
  check: VerifyCheckResult;
  country: string;
  config?: NetflixVerifyAppConfig;
}

interface VerifyCheckResult {
  Available: boolean;
  SelfMade: boolean;
  NonSelfMade: boolean;
}


export async function verify({ proxy, ...options }: VerifyOptions): Promise<VerifyResult> {
  using closer = new Closer();
  let { ProxyAgent, Pool } = await import('undici');
  const result: VerifyCheckResult = {
    Available: false,
    SelfMade: false,
    NonSelfMade: false,
  };
  const init: Record<string, any> = {
    redirect: 'manual',
  };
  // https proxy not works
  if (proxy) {
    const u = new URL(proxy);
    const uu = new URL(proxy);
    uu.username = '';
    uu.password = '';
    let agent = new ProxyAgent({
      proxyTls: {
        // 避免 https 代理异常
        rejectUnauthorized: false,
      },
      // uri: u.origin + u.pathname,
      uri: uu.toString(),
      // same as proxy-authorization header
      token: (u.username || u.password) ? `Basic ${Buffer.from(`${decodeURIComponent(u.username)}:${decodeURIComponent(u.password)}`).toString('base64')}` : undefined,
      protocol: u.protocol,
      clientFactory: (origin, opts) => {
        // console.log(`Create proxy factory to ${origin}`);
        return new Pool(origin, {
          ...opts,
          connect: (...args) => {
            // console.log(`Connect Proxy`, args[0]);
            return opts.connect.apply(null, args);
          },
        });
      },
    });
    // agent = new ProxyAgent(proxy)
    closer.add(agent);
    init.dispatcher = agent;
  }
  let config: NetflixVerifyAppConfig | undefined;

  try {
    const res = await fetch('http://api-global.netflix.com/apps/applefuji/config', init);
    if (!res.ok) {
      // 403
      return {
        check: result,
        country: '',
      };
    }

    const { XMLParser } = await import('fast-xml-parser');
    const parser = new XMLParser();
    let text = await res.text();
    let out = parser.parse(text) as { config: NetflixVerifyAppConfig };
    if (!out.config) {
      console.error(out);
      throw new Error('Invalid config');
    }
    config = out.config;
  } catch (e) {
    console.error(e);
    return {
      check: result,
      country: '',
    };
  }

  const checks = {
    Available: '80018499',
    SelfMade: '80197526',
    NonSelfMade: '70143836',
  };
  for (let [k, v] of Object.entries(checks)) {
    const res = await fetch(`https://www.netflix.com/title/${v}`, init);
    // waste body
    void res.text();

    let valid = res.status < 400;
    result[k as keyof VerifyCheckResult] = valid;
    if (!valid) {
      // early
      break;
    }
  }

  return {
    check: result,
    country: config?.country,
    config,
  };
}

export interface NetflixVerifyAppConfig {
  device_supported: boolean;
  country: string;
  enable_content_header_cache: boolean;
  ncts: string;
  stall_notification_intrplay: boolean;
  'geolocation.locale': string;
  movie_norminal_to_peak_bandwidth_multiplier: number;
  movie_peakbandwidth_multiplier: number;
  instant_queue_enabled: boolean;
  showDD: boolean;
  'geolocation.asn': number;
  'geolocation.internal_network': boolean;
  support_assistive_audio: boolean;
  connection_timeout_slow: number;
  'geolocation.status': string;
  prefetch_timeout_in_seconds: number;
  manifest_expiration_in_seconds: number;
  'geolocation.country': string;
  connection_retries: number;
  header_downloader_cache_size: number;
  movie_iframe_bandwidth_multiplier: number;
  cdn_open_connect_forced: string;
  initial_bitrate_mask_wifi: number;
  support_title_audio_selection: boolean;
  selected_cdn_bandwidth_multiplier: number;
  'geolocation.language': string;
  dvd_service_allowed: boolean;
  dd_5_1_enabled: boolean;
  min_cticket_renew_seconds: number;
  connection_timeout: number;
  use_dash_profiles: boolean;
  generic_feed_url: string;
  geolocation: string;
}

class Closer implements Disposable {
  closers: Array<{ close(): void } | Function> = [];

  add(closer: { close(): void } | Function) {
    this.closers.push(closer);
  }

  [Symbol.dispose]() {
    for (let closer of this.closers) {
      if (typeof closer === 'function') {
        closer();
      } else {
        closer.close();
      }
    }
  }

  close() {
    this[Symbol.dispose]();
  }
}
