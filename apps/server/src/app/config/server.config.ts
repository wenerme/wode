import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const ServerConfig = z.object({
  port: z.coerce.number().optional().default(3000),
  prefix: z.coerce.string().optional(), // will ensure start with `/`
  origin: z.coerce.string().optional(), // no prefix
  url: z.coerce.string().optional(), // with prefix
});
export type ServerConfig = z.infer<typeof ServerConfig>;

export const serverConfig = registerAs('server', () => {
  const { PORT, SERVER_PORT = PORT, SERVER_PREFIX, SERVER_ORIGIN, SERVER_URL } = process.env;

  const data = {
    port: SERVER_PORT || 3000,
    prefix: SERVER_PREFIX,
    origin: SERVER_ORIGIN,
    url: SERVER_URL,
  };
  if (data.prefix) {
    if (!data.prefix.startsWith('/')) {
      data.prefix = `/${data.prefix}`;
    }
  }
  if (!data.url && data.origin) {
    const u = new URL(data.origin);
    u.pathname = data.prefix || '';
    data.url = u.toString();
  }
  if (data.url && !data.origin) {
    const u = new URL(data.url);
    data.origin = u.origin;
  }
  return ServerConfig.parse(data);
});
