import { z } from 'zod';
import { registerAs } from '@nestjs/config';

export const ServerConfig = z.object({
  port: z.coerce.number().optional().default(3000),
  prefix: z.coerce.string().optional(),
});
export type ServerConfig = z.infer<typeof ServerConfig>;

export const serverConfig = registerAs('server', () => {
  const { PORT, SERVER_PORT = PORT, SERVER_PREFIX } = process.env;
  return ServerConfig.parse({
    port: SERVER_PORT || 3000,
    prefix: SERVER_PREFIX,
  });
});
