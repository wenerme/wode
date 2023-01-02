import type { NextApiHandler } from 'next';
import { getOpenApiDocument } from '../../server/openapi';

const handler: NextApiHandler = (req, res) => {
  res.status(200).send(getOpenApiDocument());
};

export default handler;
