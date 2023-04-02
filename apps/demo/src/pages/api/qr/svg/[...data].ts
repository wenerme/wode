import { NextApiHandler, NextApiRequest } from 'next';
import QRCode from 'qrcode';
import { arrayOfMaybeArray } from '@wener/utils';

const handler: NextApiHandler = async (req: NextApiRequest, res) => {
  const data = arrayOfMaybeArray(req.query.data).join('/');
  if (!data) {
    res.json({
      error: 'invalid data',
    });
    res.status(400).end();
    return;
  }
  let buf;
  if (data.startsWith('base64:')) {
    buf = Buffer.from(data.slice(7), 'base64');
  } else if (data.startsWith('b64:')) {
    buf = Buffer.from(data.slice(4), 'base64');
  }
  if (!buf) {
    res.json({
      error: 'invalid data',
    });
    res.status(400).end();
    return;
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  const out = await QRCode.toString(buf.toString(), { type: 'svg' });
  res.send(out);
};

export default handler;
