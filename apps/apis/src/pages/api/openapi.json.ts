import type { NextApiHandler } from 'next';
import { getOpenApiDocument } from '../../server/openapi';

const handler: NextApiHandler = (req, res) => {
  let origin;
  if (req.headers.host) {
    origin = new URL((process.env.NODE_ENV === 'development' ? 'http://' : 'https://') + req.headers.host).origin;
  }
  res.status(200).send(getOpenApiDocument({ origin }));
};

export default handler;
