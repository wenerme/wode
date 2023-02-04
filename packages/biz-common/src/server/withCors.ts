import { runNextCors } from 'common/src/nextjs/server';
import { type NextApiHandler, type NextApiRequest, type NextApiResponse } from 'next';

export function withCors(next: NextApiHandler) {
  // The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'
  const options = {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
    origin: [
      //
      'https://wener.me',
      'https://wener.tech',
      // this site
      'https://apis.wener.me',
      'https://apis.wener.tech',
      // local
      'http://127.0.0.1:3000',
      'http://0.0.0.0:3000',
      'http://localhost:3000',
      // vite dev
      'http://localhost:5173',
      // vite preview
      'http://localhost:4173',
    ],
  };
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await runNextCors(req, res, options);
    return await next(req, res);
  };
}
