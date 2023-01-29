import { runNextCors } from 'common/src/nextjs/server';
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';

export function withCors(next: NextApiHandler) {
  const options = {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: '*',
  };
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await runNextCors(req, res, options);
    return await next(req, res);
  };
}
