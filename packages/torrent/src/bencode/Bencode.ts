import { AbstractEncoding, classOf, isBuffer, isDefined } from '@wener/utils';
import { ArrayBuffers, ArrayBufferViewLike } from './ArrayBuffers';

const INTEGER_START = 0x69; // 'i'
const STRING_DELIM = 0x3a; // ':'
const DICT_START = 0x64; // 'd'
const LIST_START = 0x6c; // 'l'
const END_OF_TYPE = 0x65; // 'e'

class Decoder {
  readIndex = 0;

  constructor(readonly view: Uint8Array) {}

  integer(): Number {
    let { readIndex: pos, view: view } = this;
    pos++; // marker

    let idx = view.indexOf(END_OF_TYPE, pos);
    if (idx === -1) {
      throw new Error(`Invalid bencode integer at ${pos}`);
    }
    this.readIndex = idx + 1;
    return Number(ArrayBuffers.stringify(view.subarray(pos, idx)));
  }

  buffer() {
    let { readIndex: pos, view } = this;

    // string as buffer
    let idx = view.indexOf(STRING_DELIM, pos);
    if (idx === -1) {
      throw new Error(`Invalid bencode string at ${pos}`);
    }
    let len = Number(ArrayBuffers.stringify(view.subarray(pos, idx)));
    if (isNaN(len)) {
      throw new Error(`Invalid bencode string length at ${pos}`);
    }
    pos = idx + 1;
    this.readIndex = pos + len;
    return view.slice(pos, this.readIndex).buffer;
  }

  decode() {
    let { view } = this;

    switch (view[this.readIndex]) {
      case DICT_START: {
        this.readIndex++;
        const out: Record<string, any> = {};
        while (view[this.readIndex] !== END_OF_TYPE) {
          out[ArrayBuffers.stringify(this.buffer())] = this.decode();
        }
        this.readIndex++;
        return out;
      }
      case LIST_START:
        this.readIndex++;
        const out: any[] = [];
        while (view[this.readIndex] !== END_OF_TYPE) {
          out.push(this.decode());
        }
        this.readIndex++;
        return out;
      case INTEGER_START: {
        return this.integer();
      }

      default: {
        return this.buffer();
      }
    }
  }
}

class Bencode implements AbstractEncoding<any> {
  #BUFFER_DICT_START = new Uint8Array([DICT_START]);
  #BUFFER_LIST_START = new Uint8Array([LIST_START]);
  #BUFFER_END_OF_TYPE = new Uint8Array([END_OF_TYPE]);

  encode = (data: any, buffer?: ArrayBuffer, offset = 0): ArrayBuffer => {
    const buffers: ArrayBuffer[] = [];
    this.#_encode(buffers, data);
    return ArrayBuffers.concat(buffers, buffer, offset);
  };

  decode(buffer: ArrayBuffer, start = 0, end?: number) {
    let view = new Uint8Array(buffer, start, end);
    return new Decoder(view).decode();
  }

  byteLength = (data: any) => {
    return this.#_byteLength(data);
  };

  #_byteLength(data: any) {
    if (data instanceof ArrayBuffer || isBuffer(data)) {
      return String(data.byteLength).length + 1 + data.byteLength;
    }
    if (ArrayBuffer.isView(data)) {
      return data.byteLength;
    }
    let sum = 0;
    let type = classOf(data);
    switch (type) {
      case 'String':
        let raw = ArrayBuffers.from(data);
        sum += String(raw.byteLength).length + 1;
        sum += raw.byteLength;
        break;
      case 'Boolean':
      case 'Number': {
        data = type === 'Boolean' ? Number(data) : data;
        const maxLo = 0x80000000;
        const hi = (data / maxLo) << 0;
        const lo = data % maxLo << 0;
        const val = hi * maxLo + lo;
        sum += 2 + String(val).length;
        break;
      }
      case 'Map':
      case 'Object': {
        sum += 2;
        const keys = Array.from(type === 'Map' ? data.keys() : Object.keys(data)) as Array<string>;
        for (const key of keys) {
          let val = type === 'Map' ? data.get(key) : data[key];
          if (!isDefined(val)) continue;
          // force string
          sum += this.#_byteLength(ArrayBuffer.isView(key) ? ArrayBuffers.stringify(key) : String(key));
          sum += this.#_byteLength(val);
        }
        break;
      }
      case 'Set':
      case 'Array': {
        sum += 2;
        for (let v of data) {
          if (!isDefined(v)) continue;
          sum += this.#_byteLength(v);
        }
        break;
      }
      default:
        throw new TypeError(`Unsupported encode type ${type}`);
    }
    return sum;
  }

  #_encode(buffers: Array<ArrayBufferViewLike>, data: any) {
    if (data instanceof ArrayBuffer || isBuffer(data)) {
      buffers.push(ArrayBuffers.from(data.byteLength + ':'));
      buffers.push(data);
      return;
    }
    if (ArrayBuffer.isView(data)) {
      buffers.push(data);
      return;
    }
    let type = classOf(data);
    switch (type) {
      case 'String':
        let raw = ArrayBuffers.from(data);
        buffers.push(ArrayBuffers.from(raw.byteLength + ':'));
        buffers.push(raw);
        break;
      case 'Boolean':
      case 'Number': {
        data = type === 'Boolean' ? Number(data) : data;
        const maxLo = 0x80000000;
        const hi = (data / maxLo) << 0;
        const lo = data % maxLo << 0;
        const val = hi * maxLo + lo;
        buffers.push(ArrayBuffers.from('i' + val + 'e'));
        if (process.env.NODE_ENV === 'development') {
          if (val !== data) {
            console.warn(
              'WARNING: Possible data corruption detected with value "' + data + '":',
              'Bencoding only defines support for integers, value was converted to "' + val + '"',
            );
            console.trace();
          }
        }
        break;
      }
      case 'Map':
      case 'Object': {
        buffers.push(this.#BUFFER_DICT_START);
        const keys = Array.from(type === 'Map' ? data.keys() : Object.keys(data)).sort() as Array<string>;
        for (const key of keys) {
          let val = type === 'Map' ? data.get(key) : data[key];
          if (!isDefined(val)) continue;
          // force string
          this.#_encode(buffers, ArrayBuffer.isView(key) ? ArrayBuffers.stringify(key) : String(key));
          this.#_encode(buffers, val);
        }
        buffers.push(this.#BUFFER_END_OF_TYPE);
        break;
      }
      case 'Set':
      case 'Array': {
        buffers.push(this.#BUFFER_LIST_START);

        for (let v of data) {
          if (!isDefined(v)) continue;
          this.#_encode(buffers, v);
        }

        buffers.push(this.#BUFFER_END_OF_TYPE);
        break;
      }
      default:
        throw new TypeError(`Unsupported encode type ${type}`);
    }
  }
}

export default new Bencode();
