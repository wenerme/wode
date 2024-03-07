import { ArrayBuffers } from './ArrayBuffers';

export interface ParsedDataUri {
  type: string;
  params: Record<string, string | boolean>;
  content: string;
  base64: boolean;

  getData(enc: 'utf-8' | 'base64'): Promise<string>;

  getData(): Promise<ArrayBuffer>;
}

export function parseDataUri(data: string): undefined | ParsedDataUri {
  if (!data || !data.startsWith('data:')) {
    return;
  }
  // https://en.wikipedia.org/wiki/Data_URI_scheme
  // data:content/type;base64,
  // data:content/type;a=b,content
  const [header, body] = data.split(',');
  const [type, ...paramsStr] = header.slice('data:'.length).split(';');
  const content = body;
  const params: Record<string, string | boolean> = Object.fromEntries(
    paramsStr.map((s) => {
      const [k, v] = s.trim().split('=');
      return [k, v ?? true];
    }),
  );
  // params charset=utf-8
  // params base64
  // params a=b
  let base64 = Boolean(params['base64']);
  return {
    type,
    params,
    content,
    base64,
    getData: async (enc?: 'utf-8' | 'base64') => {
      if (!enc) {
        return await fetch(data).then((v) => v.arrayBuffer());
      }
      //
      let buf: BufferSource;
      if (base64) {
        if (enc === 'base64') {
          return content;
        }
        buf = await fetch(data).then((v) => v.arrayBuffer());
      } else {
        let raw = decodeURIComponent(content);
        if (enc === 'utf-8') {
          return raw;
        }
        buf = ArrayBuffers.from(raw, 'utf-8');
      }
      if (enc === 'utf-8') {
        return new TextDecoder(enc).decode(buf);
      }
      if (enc === 'base64') {
        return ArrayBuffers.toString(buf, 'base64');
      }
      return buf;
    },
  } as ParsedDataUri;
}
