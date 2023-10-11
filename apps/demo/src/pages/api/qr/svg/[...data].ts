import { arrayOfMaybeArray } from '@wener/utils';
import { NextApiHandler, NextApiRequest } from 'next';
import QRCode from 'qrcode';

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
  } else {
    buf = Buffer.from(data, 'utf-8');
  }
  if (!buf) {
    res.json({
      error: 'invalid data',
    });
    res.status(400).end();
    return;
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  let str = buf.toString();
  console.log('QrCode', str);
  const out = await QRCode.toString(str, { type: 'svg' });
  res.send(out);
};

export default handler;
