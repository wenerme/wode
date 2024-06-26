import { Closer, FetchLike } from '@wener/utils';

export interface VerifyOptions {
  fetch?: FetchLike;
  proxy?: string;
}

export interface VerifyResult {
  check: VerifyCheckResult;
  country: string;// country code - sg
  config?: NetflixVerifyAppConfig;
}

interface VerifyCheckResult {
  Available: boolean;
  SelfMade: boolean;
  NonSelfMade: boolean;
}


export async function verifyNetflixProxy({ proxy, ...options }: VerifyOptions): Promise<VerifyResult> {
  // DisposableStack
  using closer = new Closer();
  let { ProxyAgent, Pool } = await import('undici');
  const result: VerifyCheckResult = {
    Available: true,
    SelfMade: true,
    NonSelfMade: true,
  };
  const out: VerifyResult = {
    country: '',
    check: result,
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
        // NOTE 避免 https 代理异常
        rejectUnauthorized: false,
      },
      // uri: u.origin + u.pathname,
      uri: uu.toString(),
      // same as proxy-authorization header
      token: (u.username || u.password) ? `Basic ${Buffer.from(`${decodeURIComponent(u.username)}:${decodeURIComponent(u.password)}`).toString('base64')}` : undefined,
      // @ts-ignore
      protocol: u.protocol,
      // clientFactory: (origin, opts) => {
      //   return new Pool(origin, {
      //     ...opts,
      //     connect: (...args) => {
      //       return opts.connect.apply(null, args);
      //     },
      //   });
      // },
    });
    // agent = new ProxyAgent(proxy)
    closer.defer(agent);
    init.dispatcher = agent;
  }
  let config: NetflixVerifyAppConfig | undefined;


  {
    const checks = {
      // 乐观的顺序
      NonSelfMade: [
        '81726714',// 葬送的
        '80027042', //闪电侠
        '70143836',
        // 可能会变
        // '70140425', // 越狱
        // '70283261', // 始祖家族
        // '70143860', '70202589', '70305903',
      ],
      SelfMade: ['80197526'],
      Available: ['80018499'],
    };

    for (let [type, ids] of Object.entries(checks)) {
      for (let id of ids) {
        let res: Response;
        try {
          res = await fetch(`https://www.netflix.com/title/${id}`, init);
        } catch (e) {
          console.error(`Fetch ERROR: ${String(e)}`);
          return {
            check: result,
            country: '',
          };
        }

        let valid = res.status < 400;
        result[type as keyof VerifyCheckResult] &&= valid;

        console.log(`CHECK ${type}: ${id} ${valid ? '✅' : '❌'}`);

        if (!valid) {
          break;
        }


        // tw 不是 302，而是 200, 被识别为 US
        out.country ||= res.headers.get('Location')?.split('/')[3] || '';
        if (!out.country && res.status === 200) {
          // us 不会重定向
          out.country = 'us';
        }
        // waste body
        void res.text();

        // fixme 暂时只检测一个
        break;
      }

      // 成功就停止
      if (result[type as keyof VerifyCheckResult]) {
        break;
      }
    }
  }

  if (result.NonSelfMade) {
    result.SelfMade = true;
  }
  if (result.SelfMade) {
    result.Available = true;
  }

  if (!out.country) {
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

    out.country = config.country;
  }


  return out;
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

