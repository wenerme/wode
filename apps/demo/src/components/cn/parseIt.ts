export interface Parser {
  name: string;
  title: string;
  description?: string;
  length?: number;
  pattern?: RegExp;
  parse?: (s: string) => any;
  generate?: (o?: any) => string;

  model?: ParseableModel<any>;
}

export interface ParseableModel<T extends abstract new (...args: any) => any> {
  random(): InstanceType<T>;

  parse(s: string): InstanceType<T>;

  toString(): string;
}

export interface ParseResult {
  parser: Parser;
  raw: string;
  matched: boolean;
  data?: any;
}

export function tryParse(raw: string, parsers: Parser[]): ParseResult[] {
  raw = raw.trim();
  const len = raw.length;
  return parsers.map((parser) => {
    const { name, length, pattern, parse } = parser;
    if ((length && len !== length) || (pattern && !pattern.test(raw))) {
      return { parser, raw, matched: false };
    }
    let data: any;
    try {
      data = parse?.(raw);
    } catch (e) {
      console.error(`failed to parse ${name}:`, e);
    }
    return {
      parser,
      raw,
      matched: Boolean(data),
      data,
    };
  });
}

// export function parseIt(raw: string): ParsedIt | undefined {
//   raw = raw.trim();
//   if (!raw) {
//     return;
//   }
//   const out: ParsedIt = {
//     raw,
//     type: '',
//     maybe: [],
//   };
//   const len = raw.length;
//   // http://www.chinatax.gov.cn/chinatax/n810219/n810744/n2594306/c101700/index.html
//   if (len === 18 && USICRegex.test(raw)) {
//     out.usci = parseUSCI(raw);
//   }
//   if (len === 36) {
//     try {
//       out.ulid = { ...parseULID(raw), raw };
//     } catch (e) {
//       //
//     }
//   }
//
//   if (/^[+-][0-9.,]+$/.test(raw)) {
//     const n = parseFloat(raw);
//     if (!Number.isNaN(n)) {
//       out.number = { raw, number: n };
//     }
//   }
//
//   try {
//     const url = new URL(raw);
//     out.url = { raw, url };
//   } catch (e) {
//   }
//
//   return out;
// }

// export interface ParsedIt {
//   raw: string;
//   type: string;
//
//   ulid?: {
//     raw: string;
//     timestamp: number;
//     random: string;
//   };
//   uuid?: {
//     raw: string;
//     a: bigint;
//     b: bigint;
//   };
//   ChinaCitizenId?: ChinaCitizenId;
//   timestamp?: {
//     raw: string;
//     timestamp: number;
//   };
//   number?: {
//     raw: string;
//     number: number;
//   };
//   hex?: {
//     raw: string;
//     string?: string;
//     binary: Uint8Array;
//   };
//   base64?: {
//     raw: string;
//     string?: string;
//     binary: Uint8Array;
//   };
//   json?: {
//     raw: string;
//     json: any;
//   };
//   url?: {
//     raw: string;
//     url: URL;
//   };
//
//   maybe: Array<{
//     name: string;
//     label: string;
//     description?: string;
//     data?: Record<string, any>;
//   }>;
// }
