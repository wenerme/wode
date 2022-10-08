// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUnpkg } from './[...path]';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const unpkg = await getUnpkg();
  res.status(200).json({
    cache: {
      length: unpkg.lru.length,
      size: unpkg.lru.size,
    },
  });
}
