// https://github.com/yonycalsin/nextjs-cors/blob/master/src/index.ts
import cors, { type CorsOptions, type CorsOptionsDelegate } from 'cors';
import { type NextApiRequest, type NextApiResponse } from 'next';

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function initMiddleware(middleware: typeof cors) {
  return (req: NextApiRequest, res: NextApiResponse, options?: CorsOptions | CorsOptionsDelegate) =>
    new Promise((resolve, reject) => {
      middleware(options)(req, res, (result: Error | unknown) => {
        if (result instanceof Error) {
          reject(result);
          return;
        }

        resolve(result);
      });
    });
}

// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
export const runNextApiCors = initMiddleware(cors);
