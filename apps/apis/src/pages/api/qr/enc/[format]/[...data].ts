import { NextApiHandler, NextApiRequest } from 'next';
import QRCode from 'qrcode';
import { z } from 'zod';
import { arrayOfMaybeArray } from '@wener/utils';

const handler: NextApiHandler = async (req: NextApiRequest, res) => {
  const data = arrayOfMaybeArray(req.query.data).join('/');
  const params = await QrGenParams.safeParse(req.query);
  if (!data || !params.success) {
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

  let str = buf.toString();
  console.log('QrCode', str);

  const { format } = params.data;
  if (format === 'svg') {
    res.setHeader('Content-Type', 'image/svg+xml');
    const out = await QRCode.toString(str, { type: 'svg' });
    res.send(out);
  } else if (format === 'png') {
    res.setHeader('Content-Type', 'image/png');
    res.send(await QRCode.toBuffer(str, { type: 'png' }));
  }
};

export default handler;

const QrGenParams = z.object({
  format: z.enum(['png', 'svg']),
  level: z.enum(['low', 'medium', 'quartile', 'high', 'L', 'M', 'Q', 'H']).optional(),
});
