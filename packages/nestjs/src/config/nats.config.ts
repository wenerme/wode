import { z } from 'zod';
import { parseBoolean } from '@wener/utils';

export const NatsConfig = z.object({
  debug: z.coerce.boolean().optional(),
  name: z.string().optional(),
  password: z.string().optional(),
  username: z.string().optional(),
  host: z.string().optional(),
  port: z.coerce.number().optional(),
  servers: z.string().array().default([]),
  tls: z.any().optional(),
  maxReconnectAttempts: z.coerce.number().optional(),
});
export type NatsConfig = z.infer<typeof NatsConfig>;

export function getNatsConfig(env = process.env) {
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
    for (const url of NATS_URL.split(',')) {
      try {
        const u = new URL(url);
        NATS_USERNAME ||= u.username;
        NATS_PASSWORD ||= u.password;
        u.username = '';
        u.password = '';
        servers.push(u.toString());
      } catch (e) {
        console.warn(`Invalid NATS_URL ${NATS_URL}`, e);
      }
    }
  } else if (NATS_HOST) {
    servers.push(`${NATS_HOST}:${NATS_PORT || 4222}`);
  }

  if (parseBoolean(NATS_TLS)) {
    tls = {};
  }

  return NatsConfig.parse({
    debug: parseBoolean(NATS_DEBUG),
    name: NATS_NAME,
    password: NATS_PASSWORD,
    username: NATS_USERNAME,
    servers,
    tls,
    maxReconnectAttempts: NATS_MAX_RECONNECT_ATTEMPTS,
  });
}

export function getNatsOptions() {
  const {
    debug,
    name,
    password: pass,
    username: user,
    host,
    servers,
    tls,
    maxReconnectAttempts = -1, // default 10
  } = getNatsConfig();
  return {
    debug,
    name,
    pass,
    user,
    servers,
    tls,
    maxReconnectAttempts,
  };
}
