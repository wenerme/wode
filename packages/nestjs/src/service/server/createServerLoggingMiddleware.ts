import { Logger } from '@nestjs/common';
import type { ServerMiddleware } from './ServiceRegistry';
import type { ServerRequest } from './types';

export const createServerLoggingMiddleware = ({
  logger: log = new Logger('ServerHandler'),
}: {
  logger?: Logger;
} = {}): ServerMiddleware => {
  return (next) => {
    return async (req: ServerRequest) => {
      log.log(`<- ${req.service}.${req.method} from ${req.headers['x-instance-id']}`);
      const start = Date.now();
      return next(req).then((out) => {
        if (out.ok) {
          log.log(`-> ${req.service}.${req.method} from ${req.headers['x-instance-id']} ${Date.now() - start}ms`);
        } else {
          log.warn(
            `-> ${req.service}.${req.method} from ${req.headers['x-instance-id']} ${Date.now() - start}ms (${
              out.code
            }): ${out.description}`,
          );
        }
        return out;
      });
    };
  };
};
