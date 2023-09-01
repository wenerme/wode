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
});
export type NatsConfig = z.infer<typeof NatsConfig>;

export function getNatsConfig(env = process.env) {
  let { NATS_URL, NATS_HOST, NATS_PORT, NATS_DEBUG, NATS_NAME, NATS_PASSWORD, NATS_USERNAME, NATS_TLS } = env;
  let servers: string[] = [];
  let tls = null;
  if (NATS_URL) {
    try {
      const u = new URL(NATS_URL);
      NATS_USERNAME ||= u.username;
      NATS_PASSWORD ||= u.password;
      u.username = '';
      u.password = '';
      servers.push(u.toString());
    } catch (e) {
      console.warn(`Invalid NATS_URL ${NATS_URL}`, e);
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
  });
}

export function getNatsOptions() {
  const { debug, name, password: pass, username: user, host, servers, tls } = getNatsConfig();
  return {
    debug,
    name,
    pass,
    user,
    servers,
    tls,
  };
}
