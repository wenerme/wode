import { expect, test } from 'vitest';
import { ArrayBuffers } from '../../io/ArrayBuffers';
import { PEM } from './pem';

const { decode, encode } = PEM;

test('pem', () => {
  const pem = `-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,ABC

MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw
MDAwMDAwMDAwMDAwMDAwMA==
-----END RSA PRIVATE KEY-----
`;
  const input = `Nice\n${pem}Hello
`;
  const out = {
    block: {
      type: 'RSA PRIVATE KEY',
      header: {
        'Proc-Type': '4,ENCRYPTED',
        'DEK-Info': 'DES-EDE3-CBC,ABC',
      },
      bytes: ArrayBuffers.from('0'.repeat(64)),
    },
    head: 'Nice\n',
    tail: 'Hello\n',
  };
  expect(decode(input)).toEqual(out);
  expect(encode(out.block)).toBe(pem);
});
test('cases', () => {
  for (const b of [
    {
      type: 'RSA PRIVATE KEY',
      bytes: 'Hello',
    },
    {
      type: 'RSA PRIVATE KEY',
      header: {
        Name: 'N-:1/=',
        Age: '1234',
      },
      bytes: ArrayBuffers.from('Nice'),
    },
  ]) {
    const s = encode(b);
    const act = decode(s);
    expect({
      ...act.block,
      bytes: ArrayBuffers.toString(act.block.bytes),
    }).toStrictEqual({
      header: {},
      ...b,
      bytes: ArrayBuffers.toString(b.bytes),
    });
    expect(s).matchSnapshot();
  }
});
