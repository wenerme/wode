import test from 'ava';
import { ArrayBuffers } from '@wener/utils';
import Bencode from './Bencode';

const { encode, decode } = Bencode;

test('encode', (t) => {
  t.log('should always return a Buffer');
  t.true(isArrayBuffer(encode({})), 'its a buffer for empty dicts');
  t.true(isArrayBuffer(encode('test')), 'its a buffer for strings');
  t.true(isArrayBuffer(encode([3, 2])), 'its a buffer for lists');
  t.true(isArrayBuffer(encode({ a: 'b', 3: 6 })), 'its a buffer for big dicts');
  t.true(isArrayBuffer(encode(123)), 'its a buffer for numbers');

  t.log('should sort dictionaries');
  t.is(
    ArrayBuffers.toString(
      encode({
        string: 'Hello World',
        integer: 12345,
      }),
    ),
    'd7:integeri12345e6:string11:Hello Worlde',
  );

  t.is(
    ArrayBuffers.toString(
      encode(
        new Map([
          [12, 'Hello World'],
          [34, 12345],
        ] as any),
      ),
    ),
    'd2:1211:Hello World2:34i12345ee',
    'should force keys to be strings',
  );

  t.is(
    ArrayBuffers.toString(
      encode(
        new Map([
          [12, 'Hello World'],
          ['34', 12345],
          [Buffer.from('buffer key'), Buffer.from('buffer value')],
        ] as any),
      ),
    ),
    'd2:1211:Hello World2:34i12345e10:buffer key12:buffer valuee',
    'should encode a Map as dictionary',
  );

  for (const [k, v, m] of [
    [123, 'i123e'],
    [true, 'i1e'],
    [Boolean(false), 'i0e'],
    [Number(123), 'i123e'],
    [-123, 'i-123e'],
    [123.5, 'i123e'],
    [-123.5, 'i-123e'],
    [2433088826, 'i2433088826e'],
    [-0xffffffff, `i${-0xffffffff}e`],
    [0xffffffff, `i${0xffffffff}e`],
    [-0xffffffff - 0.5, `i${-0xffffffff}e`],
    ['asdf', `4:asdf`],
    [':asdf:', `6::asdf:`],
    ['你:好', `${ArrayBuffers.from('你:好').byteLength}:你:好`],
    [[32, 12], 'li32ei12ee'],
    [['32', '12'], 'l2:322:12e'],
    [new Set([32, 12]), 'li32ei12ee'],
    [new Set(['32', '12']), 'l2:322:12e'],
    [{ a: 'bc' }, 'd1:a2:bce'],
    [{ a: Buffer.from('bc') }, 'd1:a2:bce'],
    [{ b: 45, a: '45' }, 'd1:a2:451:bi45ee'],
    // arraybuffer, buffer as string
    [ArrayBuffers.from('asdf'), `4:asdf`],
    [Buffer.from('asdf'), `4:asdf`],
    [
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      new Uint8Array(['9'.charCodeAt(0), ':'.charCodeAt(0), 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      'Uint8Array as string',
    ],
    // typed array as raw
    [new DataView(new Uint8Array([1, 2, 3]).buffer), new Uint8Array([1, 2, 3]), 'DataView as buffer'],
    [
      new Uint32Array([0xf, 0xff, 0xfff, 0xffff, 0xfffff, 0xffffff, 0xfffffff, 0xffffffff]),
      new Uint32Array([0xf, 0xff, 0xfff, 0xffff, 0xfffff, 0xffffff, 0xfffffff, 0xffffffff]),
      'Uint32Array as buffer',
    ],
    [
      new Float32Array([1.2, 2.3, 3.4, 4.5, 5.6, 6.7, 7.8, 8.9, 9.0]),
      new Float32Array([1.2, 2.3, 3.4, 4.5, 5.6, 6.7, 7.8, 8.9, 9.0]),
      'Float32Array as buffer',
    ],
  ]) {
    let buf = encode(k);
    //
    let l = Bencode.byteLength(k);
    t.is(l, buf.byteLength, `byteLength ${l} != ${buf.byteLength}`);
    if (typeof v === 'string') {
      let out = ArrayBuffers.toString(buf);
      t.is(out, v, `should encode ${k} as ${v}`);
      // t.log(`decoding ${v} ->`);
      let data = decode(buf);
      t.is(ArrayBuffers.toString(encode(data)), v, `should decode ${k} to ${data}`);
    } else {
      t.deepEqual(buf, ArrayBuffers.from(v as any), m ? (m as string) : `should encode ${k} as ${v}`);
    }
  }
});

function isArrayBuffer(v: any) {
  return v instanceof ArrayBuffer;
}
