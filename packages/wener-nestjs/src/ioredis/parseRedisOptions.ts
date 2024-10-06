import type { RedisOptions } from 'ioredis';

export function parseRedisOptions(o: (RedisOptions & { url?: string }) | string): RedisOptions {
  const opts = typeof o === 'string' ? { url: o } : o;
  const url = opts.url;
  if (!url) {
    return opts;
  }
  let u = new URL(url);
  let out = {
    ...opts,
    host: u.hostname,
    port: Number(u.port),
    password: opts.password || u.password,
    username: opts.password || u.username,
    db: Number(u.pathname.slice(1)) || 0,
  };

  if (u.protocol === 'rediss:') {
    out.tls = {
      servername: parseServerName(u),
    };
  }

  return out;
}

function parseServerName(u: URL) {
  let sni = u.searchParams.get('servername') || u.searchParams.get('sni');
  if (sni) {
    switch (sni) {
      case '':
      case '1':
      case 'true':
        return u.hostname;
      case '0':
      case 'false':
        break;
      default:
        return sni;
    }
  } else {
    // if not ipv4 or ipv6, set servername
    if (!/^[0-9.:-]+$/.test(u.hostname)) {
      return u.hostname;
    }
  }
  return undefined;
}

interface ParsedRedisUrl {
  hostname: string;
  port: number;
  password: string;
  username: string;
  db?: number;
  tls?: { servername?: string };
}

function parseRedisUrl(u: string) {
  let url = new URL(u);
  let out: ParsedRedisUrl = {
    hostname: url.hostname,
    port: Number(url.port),
    password: url.password,
    username: url.username,
  };

  if (url.pathname.length > 1) {
    out.db = Number(url.pathname.split('/')[1]) || 0;
  }

  if (url.protocol === 'rediss:') {
    out.tls = {
      servername: parseServerName(url),
    };
  }

  return out;
}
