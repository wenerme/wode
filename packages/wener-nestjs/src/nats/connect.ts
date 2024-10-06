import { parseBoolean } from '@wener/utils';
import type { ConnectionOptions, NatsConnection } from 'nats';
import { z } from 'zod';
import { getNatsOptions } from '../config';

export async function connect(opts: Partial<ConnectionOptions> = getNatsOptions()): Promise<NatsConnection> {
  const isWs = Array.from(opts.servers ?? []).some((v) => /^ws?s:/.test(v));
  if (isWs) {
    // nextjs 用 ws 有问题
    const { connect } = await import('nats.ws');
    return connect(opts);
  }

  const { connect } = await import('nats');
  return connect(opts);
}

export function defineNatsConfig(
  opts: Partial<ConnectionOptions> = {},
  {
    env = process.env,
  }: {
    env?: Record<string, any>;
  } = {},
) {
  let {
    NATS_URL,
    NATS_HOST,
    NATS_PORT,
    NATS_DEBUG,
    NATS_NAME,
    NATS_PASSWORD,
    NATS_USERNAME,
    NATS_TLS,
    NATS_MAX_RECONNECT_ATTEMPTS,
  } = env;
  const servers: string[] = [];
  let tls = null;
  if (NATS_URL) {
    // nats, ws, wss, natss
    servers.push(...NATS_URL.split(','));
  } else if (NATS_HOST) {
    servers.push(`${NATS_HOST}:${NATS_PORT || 4222}`);
  }

  if (parseBoolean(NATS_TLS)) {
    tls = {};
  }

  typeof opts.servers === 'string' && servers.unshift(opts.servers);
  Array.isArray(opts.servers) && servers.unshift(...opts.servers);

  opts = {
    debug: parseBoolean(NATS_DEBUG),
    name: NATS_NAME,
    pass: NATS_PASSWORD,
    user: NATS_USERNAME,
    tls,
    ...opts,
    servers,
  };

  for (let i = 0; i < servers.length; i++) {
    const url = servers[i];
    try {
      const u = new URL(url);
      opts.user ||= u.username;
      opts.pass ||= u.password;
      u.username = '';
      u.password = '';
      servers[i] = u.toString();
    } catch (error) {
      console.warn(`Invalid NATS_URL ${NATS_URL}`, error);
    }
  }

  return opts;
}

const NatsOptionSchema = z.object({
  debug: z.coerce.boolean().optional(),
  name: z.string().optional(),
  pass: z.string().optional(),
  user: z.string().optional(),
  host: z.string().optional(),
  port: z.coerce.number().optional(),
  servers: z.string().array().default([]),
  tls: z.any().optional(),
  maxReconnectAttempts: z.coerce.number().optional(),
});
