import { NextApiHandler, NextApiRequest } from 'next';
import QRCode, { QRCodeRenderersOptions } from 'qrcode';
import { z } from 'zod';
import { arrayOfMaybeArray } from '@wener/utils';

const handler: NextApiHandler = async (req: NextApiRequest, res) => {
  const data = arrayOfMaybeArray(req.query.data).join('/');
  const params = await Params.safeParse(req.query);
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

  const { format, version, level: errorCorrectionLevel, margin, scale, width, bg, fg } = params.data;
  const opts: QRCodeRenderersOptions = {
    version,
    errorCorrectionLevel,
    margin,
    scale,
    width,
    color: {
      light: bg,
      dark: fg,
    },
  };

  console.log('QR Encode', str, trim(opts));

  res.setHeader('Cache-Control', 'public,max-age=31536000');

  if (format === 'svg') {
    res.setHeader('Content-Type', 'image/svg+xml');
    const out = await QRCode.toString(str, { type: 'svg', ...opts });
    res.send(out);
  } else if (format === 'png') {
    res.setHeader('Content-Type', 'image/png');
    res.send(await QRCode.toBuffer(str, { type: 'png', ...opts }));
  }
};

export default handler;

const Params = z.object({
  format: z.enum(['png', 'svg']),
  level: z.enum(['low', 'medium', 'quartile', 'high', 'L', 'M', 'Q', 'H']).optional(),
  version: z.number().optional(),
  margin: z.number().optional(),
  scale: z.number().optional(),
  width: z.number().optional(),
  bg: z
    .string()
    .optional()
    .transform((v) => (v ? '#' + v : v)),
  fg: z
    .string()
    .optional()
    .transform((v) => (v ? '#' + v : v)),
});

export function trim(
  o: any,
  by = (v: any) => {
    switch (v) {
      case '':
      case undefined:
      case null:
        return undefined;
    }
    return v;
  },
) {
  o = by(o);
  if (o === undefined) {
    return undefined;
  }
  if (typeof o !== 'object') {
    return o;
  }
  if (Array.isArray(o)) {
    o = o.map((v) => trim(v, by)).filter((v) => v !== undefined);
    return o.length === 0 ? undefined : o;
  }
  for (const k in o) {
    const v = (o[k] = trim(o[k]));
    if (v === undefined) {
      delete o[k];
    }
  }
  return Object.keys(o).length === 0 ? undefined : o;
}
