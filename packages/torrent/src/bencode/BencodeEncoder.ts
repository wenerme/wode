import { ArrayBuffers, classOf, isBuffer, isDefined } from '@wener/utils';
import { DICT_START, END_OF_TYPE, LIST_START } from './BencodeDecoder';

interface BencodeEncoderOptions {
  isString: (v: any) => boolean;
}

export class BencodeEncoder {
  static #BUFFER_DICT_START = new Uint8Array([DICT_START]);
  static #BUFFER_LIST_START = new Uint8Array([LIST_START]);
  static #BUFFER_END_OF_TYPE = new Uint8Array([END_OF_TYPE]);
  #options: BencodeEncoderOptions = {
    isString: (v: any) => v instanceof ArrayBuffer || isBuffer(v) || v instanceof Uint8Array,
  };

  set(options: Partial<BencodeEncoderOptions>) {
    Object.assign(this.#options, options);
    return this;
  }

  encode = (data: any, buffer?: ArrayBuffer, offset = 0): ArrayBuffer => {
    const buffers: ArrayBuffer[] = [];
    this.#_encode(buffers, data);
    return ArrayBuffers.concat(buffers, buffer, offset);
  };

  byteLength(data: any) {
    return this.#_byteLength(data);
  }

  #_byteLength(data: any) {
    let sum = 0;
    const isBufferSource = data instanceof ArrayBuffer || isBuffer(data) || ArrayBuffer.isView(data);
    if (isBufferSource) {
      sum += data.byteLength;
      if (this.#options.isString(data)) {
        sum += String(data.byteLength).length + 1;
      }
      return sum;
    }
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
          sum += this.#_byteLength(ArrayBuffer.isView(key) ? ArrayBuffers.toString(key) : String(key));
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

  #_encode(buffers: Array<BufferSource>, data: any) {
    const isBufferSource = data instanceof ArrayBuffer || isBuffer(data) || ArrayBuffer.isView(data);
    if (isBufferSource) {
      if (this.#options.isString(data)) {
        buffers.push(ArrayBuffers.from(data.byteLength + ':'));
      }
      buffers.push(data);
      return;
    }

    // // treat arraybuffer & buffer as string
    // if (data instanceof ArrayBuffer || isBuffer(data)) {
    //   buffers.push(ArrayBuffers.from(data.byteLength + ':'));
    //   buffers.push(data);
    //   return;
    // }
    // // treat arraybuffer view as raw data
    // if (ArrayBuffer.isView(data)) {
    //   buffers.push(data);
    //   return;
    // }

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
        buffers.push(BencodeEncoder.#BUFFER_DICT_START);
        const keys = Array.from(type === 'Map' ? data.keys() : Object.keys(data)) as Array<string>;
        keys.sort();
        for (const key of keys) {
          let val = type === 'Map' ? data.get(key) : data[key];
          if (!isDefined(val)) continue;
          // force string
          this.#_encode(buffers, ArrayBuffer.isView(key) ? ArrayBuffers.toString(key) : String(key));
          this.#_encode(buffers, val);
        }
        buffers.push(BencodeEncoder.#BUFFER_END_OF_TYPE);
        break;
      }
      case 'Set':
      case 'Array': {
        buffers.push(BencodeEncoder.#BUFFER_LIST_START);

        for (let v of data) {
          if (!isDefined(v)) continue;
          this.#_encode(buffers, v);
        }

        buffers.push(BencodeEncoder.#BUFFER_END_OF_TYPE);
        break;
      }
      default:
        throw new TypeError(`Unsupported encode type ${type}`);
    }
  }
}
