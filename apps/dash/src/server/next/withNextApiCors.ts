import { type NextApiHandler, type NextApiRequest, type NextApiResponse } from 'next';
import { runNextApiCors } from './runNextApiCors';

export function withNextApiCors(next: NextApiHandler) {
  // The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'
  let dev = [
    // local
    'http://127.0.0.1:3000',
    'http://0.0.0.0:3000',
    'http://localhost:3000',
    'http://localhost:8080',
    // vite dev
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    // vite preview
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:4174',
    'http://127.0.0.1:4174',
  ];

  let prod = ['https://console.wener.me'];
  //
  let origin = [...prod];
  process.env.NODE_ENV === 'development' && origin.push(...dev);
  const options = {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
    // origin:'*'
    origin,
  };
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await runNextApiCors(req, res, options);
    return next(req, res);
  };
}
