export interface ParsedString {
  readonly raw: string;
  readonly count: Record<string, number>;
  readonly chars: Set<string>;
  readonly length: number;
  readonly isHex: boolean;
  readonly isBase64: boolean;
  readonly isInteger: boolean;
  readonly isAlpha: boolean;
  readonly isAlphanumeric: boolean;
  readonly base64: Uint8Array;
  readonly integer: number;

  readonly isBinary: boolean;
}

export function parseString(raw: string): ParsedString {
  const count: Record<string, number> = {};
  const length = raw.length;
  for (const char of raw) {
    count[char] = (count[char] || 0) + 1;
  }
  const chars = new Set(Object.keys(count));
  // ignore +-.eE
  const isInteger = /^[0-9]+$/.test(raw);
  const isAlpha = /^[a-zA-Z]+$/.test(raw);
  const isAlphanumeric = /^[0-9a-zA-Z]+$/.test(raw);
  const isHex = isAlphanumeric && /^[0-9a-fA-F]+$/.test(raw);
  let isBase64 = /^[0-9a-zA-Z+/=]+$/.test(raw);

  let base64: Uint8Array;
  return {
    raw,
    chars,
    count,
    length,
    isHex,
    isAlphanumeric,
    isInteger,
    isAlpha,
    get isBase64() {
      if (base64) {
        return true;
      }
      if (isBase64) {
        try {
          const decode = atob(raw);
          base64 = new TextEncoder().encode(decode);
          return true;
        } catch (e) {
          isBase64 = false;
        }
      }
      return false;
    },
    get isBinary() {
      return this.isBase64 || this.isHex;
    },
    get base64() {
      if (this.isBase64) {
        return base64;
      }
      throw new Error('not base64');
    },
    get integer() {
      return parseInt(raw);
    },
  };
}

export function explainString(str: ParsedString) {
  return {
    get isSha1() {
      return str.length === 40 && str.isHex;
    },
    get isSha256() {
      return str.length === 64 && str.isHex;
    },
    get isMd5() {
      return str.length === 32 && str.isHex;
    },
    get isSha224() {
      return str.length === 56 && str.isHex;
    },
    get isSha384() {
      return str.length === 96 && str.isHex;
    },
    get isSha512() {
      return str.length === 128 && str.isHex;
    },
  };
}
