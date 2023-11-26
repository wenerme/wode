import { Logger } from '@nestjs/common';
import { type NextApiHandler } from 'next';
import { runContext } from '../runContext';
import { withNextApiCors } from './withNextApiCors';

const log = new Logger(`NextApiHandler`);

export function withNextApiHandler(f: NextApiHandler): NextApiHandler {
  const handler: NextApiHandler = async (...args) => {
    return f(...args);
  };

  const withLogging: NextApiHandler = async (...args) => {
    const [req] = args;
    log.log(`${req.method} ${req.url}`);

    return runContext(() => handler(...args));
  };
  return withNextApiCors(withLogging);
}
