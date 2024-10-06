import { ArrayBuffers } from '@wener/utils';
import { describe, expect, it } from 'vitest';
import { Bencode } from './Bencode';

const { encode, decode } = Bencode;

describe('Bencode', () => {
  describe('encode', () => {
    it('should always return a Buffer', () => {
      console.log('should always return a Buffer');
      expect(isArrayBuffer(encode({}))).toBe(true);
      expect(isArrayBuffer(encode('test'))).toBe(true);
      expect(isArrayBuffer(encode([3, 2]))).toBe(true);
      expect(isArrayBuffer(encode({ a: 'b', 3: 6 }))).toBe(true);
      expect(isArrayBuffer(encode(123))).toBe(true);
    });

    it('should sort dictionaries', () => {
      console.log('should sort dictionaries');
      expect(
        ArrayBuffers.toString(
          encode({
            string: 'Hello World',
            integer: 12345,
          }),
        ),
      ).toBe('d7:integeri12345e6:string11:Hello Worlde');
    });

    it('should force keys to be strings', () => {
      expect(
        ArrayBuffers.toString(
          encode(
            new Map([
              [12, 'Hello World'],
              [34, 12345],
            ] as any),
          ),
        ),
      ).toBe('d2:1211:Hello World2:34i12345ee');
    });

    it('should encode a Map as dictionary', () => {
      expect(
        ArrayBuffers.toString(
          encode(
            new Map([
              [12, 'Hello World'],
              ['34', 12345],
              [Buffer.from('buffer key'), Buffer.from('buffer value')],
            ] as any),
          ),
        ),
      ).toBe('d2:1211:Hello World2:34i12345e10:buffer key12:buffer valuee');
    });

    it('should encode various types correctly', () => {
      const testCases: Array<[any, any, string?]> = [
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
        [ArrayBuffers.from('asdf'), `4:asdf`],
        [Buffer.from('asdf'), `4:asdf`],
        [
          new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
          new Uint8Array(['9'.charCodeAt(0), ':'.charCodeAt(0), 1, 2, 3, 4, 5, 6, 7, 8, 9]),
          'Uint8Array as string',
        ],
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
      ];

      testCases.forEach(([k, v, m]) => {
        const buf = encode(k);
        const l = Bencode.byteLength(k);
        expect(l).toBe(buf.byteLength);

        if (typeof v === 'string') {
          const out = ArrayBuffers.toString(buf);
          expect(out).toBe(v);
          const data = decode(buf);
          expect(ArrayBuffers.toString(encode(data))).toBe(v);
        } else {
          expect(ArrayBuffers.asView(Uint8Array, buf)).toEqual(ArrayBuffers.asView(Uint8Array, v));
        }
      });
    });
  });
});

function isArrayBuffer(v: any) {
  return v instanceof ArrayBuffer;
}
