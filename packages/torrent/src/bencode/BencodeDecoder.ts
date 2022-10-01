import { ArrayBuffers } from './ArrayBuffers';

export const DICT_START = 0x64; // d 100
export const LIST_START = 0x6c; // l 108
const INTEGER_START = 0x69; // i 105
const STRING_DELIM = 0x3a; // : 58
export const END_OF_TYPE = 0x65; // e 101

export class BencodeDecoder {
  private readIndex = 0;
  private view: Uint8Array = new Uint8Array(0);
  #path: Array<string | number> = [];
  #options = {
    bufferPath: [] as string[],
  };

  constructor() {
  }

  addBufferPath(...s: string[]) {
    this.#options.bufferPath.push(...s);
    return this;
  }


  #integer(): Number {
    let { readIndex: pos, view: view } = this;
    pos++; // marker

    let idx = view.indexOf(END_OF_TYPE, pos);
    if (idx === -1) {
      throw new Error(`Invalid bencode integer at ${pos}`);
    }
    this.readIndex = idx + 1;
    return Number(ArrayBuffers.toString(view.subarray(pos, idx)));
  }

  #string() {
    let { readIndex: pos, view } = this;

    // string as buffer
    let idx = view.indexOf(STRING_DELIM, pos);
    if (idx === -1) {
      throw new Error(`Invalid bencode string at ${pos}`);
    }
    let len = Number(ArrayBuffers.toString(view.subarray(pos, idx)));
    if (isNaN(len)) {
      throw new Error(`Invalid bencode string length at ${pos}`);
    }
    pos = idx + 1;
    this.readIndex = pos + len;
    let buf = view.subarray(pos, this.readIndex);
    if (this.#options.bufferPath.includes(this.#path.join('.'))) {
      // copy buffer
      return new Uint8Array(buf);
    }
    return ArrayBuffers.toString(buf);
  }

  decode(view: BufferSource, start?: number, end?: number) {
    this.view = ArrayBuffers.asView(Uint8Array, view, start, end ? end - (start ?? 0) : undefined);
    this.readIndex = 0;
    return this.#decode();
  }

  #decode() {
    let { view } = this;

    switch (view[this.readIndex]) {
      case DICT_START: {
        this.readIndex++;
        const out: Record<string, any> = {};
        while (view[this.readIndex] !== END_OF_TYPE) {
          let key = ArrayBuffers.toString(this.#string());
          this.#path.push(key);
          out[key] = this.#decode();
          this.#path.pop();
        }
        this.readIndex++;
        return out;
      }
      case LIST_START:
        this.readIndex++;
        const out: any[] = [];
        let index = 0;
        while (view[this.readIndex] !== END_OF_TYPE) {
          this.#path.push(index++);
          out.push(this.#decode());
          this.#path.pop();
        }
        this.readIndex++;
        return out;
      case INTEGER_START: {
        return this.#integer();
      }

      default: {
        return this.#string();
      }
    }
  }
}
