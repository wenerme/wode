import type { Unpkg } from '@wener/unpkg';
import { createUnpkg, createUnpkgHandler } from '@wener/unpkg/server';
import { arrayOfMaybeArray, isBuffer } from '@wener/utils';
import type { NextApiRequest, NextApiResponse } from 'next';

let h: any;
export let unpkg: Unpkg;

export async function getUnpkg() {
  return (unpkg ??= await createUnpkg({
    sqlite: {
      database: '/tmp/unpkg.db',
    },
  }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  if (!h) {
    h = createUnpkgHandler({
      unpkg: await getUnpkg(),
      prefix: '/api/unpkg',
    });
  }
  const path = arrayOfMaybeArray(req.query.path).join('/');
  console.log(`unpkg: ${path}`);
  const resp = await h({ path });
  res.status(resp.status);
  for (const [k, v] of Object.entries(resp.headers)) {
    res.setHeader(k, v as any);
  }
  if (resp.headers?.Location) {
    res.redirect(resp.headers.Location);
  } else if (isBuffer(resp.body)) {
    res.send(resp.body);
  } else {
    res.json(resp.body);
  }
}
