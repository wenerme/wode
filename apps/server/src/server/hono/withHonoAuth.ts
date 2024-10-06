import { Logger } from '@nestjs/common';
import { getContext } from '@wener/nestjs';
import type { MiddlewareHandler } from 'hono';
import { AuthService } from '@/foundation/Auth/AuthService';
import { setServerContext } from '@/server/context';
import { resolveRequestToken } from '@/server/utils/resolveRequestToken';

export function withHonoAuth({ log = new Logger(withHonoAuth.name) }: { log?: Logger } = {}): MiddlewareHandler {
  return async (c, next) => {
    let { token } = resolveRequestToken(c.req.raw) || {};
    if (token) {
      try {
        const out = await getContext(AuthService).resolveAccessToken({
          accessToken: token,
        });
        setServerContext(out);

        // if (isDev()) {
        //   let headers = c.req.raw.headers;
        //   if (parseBoolean(headers.get('x-debug-db'))) {
        //     setDatabaseContext({
        //       debug: true,
        //     });
        //   }
        // }
      } catch (e) {
        log.error(`Auth Error ${token}: ${e}`);
      }
    }

    return next();
  };
}
