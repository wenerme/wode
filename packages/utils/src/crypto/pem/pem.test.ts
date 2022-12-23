import test from 'ava';
import { ArrayBuffers } from '../../io/ArrayBuffers';
import { PEM } from './pem';

const { decode, encode } = PEM;

test('pem', (t) => {
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
  t.deepEqual(decode(input), out);
  t.is(encode(out.block), pem);
});
test('cases', (t) => {
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
    t.deepEqual(
      {
        ...act.block,
        bytes: ArrayBuffers.toString(act.block.bytes),
      },
      {
        header: {},
        ...b,
        bytes: ArrayBuffers.toString(b.bytes),
      },
    );
    t.snapshot(s);
  }
});
