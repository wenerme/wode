import { ChinaCitizenId } from '@src/components/cn/gb11643/ChinaCitizenId';
import { parseULID, randomUUID, ulid } from '@wener/utils';
import { randomUSCI } from './usci/randomUSCI';
import type { ParsedUSCI } from './usci/usci';
import { parseUSCI, USICRegex } from './usci/usci';

export const Parsers: Parser[] = [
  {
    // wrV_AAAAAA0A0AAaAaaAaAAaaaAA-aaa
    name: 'WecomRoomIdFromWechat',
    title: 'Wecom Room ID from Wechat',
    // 28+4
    length: 32,
    pattern: /^wrV_[-a-zA-Z0-9]{28}$/,
  },
  {
    name: 'WecomMemberIdFromWechat',
    title: 'Wecom Member ID from Wechat',
    length: 32,
    pattern: /^wmV_[-a-zA-Z0-9]{28}$/,
  },
  {
    name: 'WecomRoomId',
    title: 'Wecom Room ID',
    length: 32,
    pattern: /^wr[-a-zA-Z0-9]{30}$/,
  },
  {
    name: 'WecomMemberId',
    title: 'Wecom Member ID',
    length: 32,
    pattern: /^wm[-a-zA-Z0-9]{30}$/,
  },
  {
    name: 'WecomCorpID',
    title: 'Wecom Corp ID/Suit ID',
    length: 32,
    pattern: /^ww[a-zA-Z0-9]{16}$/,
  },
  // wecom - wo OpenId, tj 早期套件
  {
    name: 'ChinaCitizenId',
    title: '中国公民身份证',
    description: 'Chinese National ID Card',
    length: ChinaCitizenId.Length,
    pattern: ChinaCitizenId.Pattern,
    parse: ChinaCitizenId.parse,
    generate: () => ChinaCitizenId.random().toString(),
  },
  {
    name: 'USCI',
    title: '中国统一信用代码',
    description: 'Unified Social Credit Identifier',
    length: 18,
    pattern: USICRegex,
    parse: parseUSCI,
    generate: () => randomUSCI().raw,
  },
  {
    name: 'ULID',
    title: 'ULID',
    length: 26,
    pattern: /^[0-9A-HJKMNP-TV-Z]{26}$/i,
    parse: parseULID,
    generate: () => ulid(),
  },
  {
    name: 'UUID',
    title: 'UUID',
    length: 36,
    pattern: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
    generate: () => randomUUID(),
  },
  {
    name: 'JsonObject',
    title: 'JSON Object',
    pattern: /^\{.*}$/,
    parse: (s) => JSON.parse(s),
  },
  {
    name: 'URL',
    title: 'URL',
    pattern: /^https?:\/\//i,
    parse: (s) => new URL(s),
  },
  // URI
  {
    name: 'Integer',
    title: '整数',
    pattern: /^[-+]?\d+(e\d+)?$/,
  },
  {
    name: 'Timestamp',
    title: '时间戳',
    pattern: /^\d{10,13}$/,
  },
  {
    name: 'Binary',
    title: '二进制',
    pattern: /^(0[bB])?[01]+$/,
  },
  {
    name: 'Octal',
    title: '八进制',
    pattern: /^(0[oO])?[0-7]+$/,
  },
  {
    name: 'Hex',
    title: 'Hex',
    pattern: /^(0x)?[0-9A-F]+$/i,
  },
  {
    name: 'Base32',
    title: 'Base32',
    pattern: /^[A-Z2-7]+$/i,
  },
  {
    name: 'Base64',
    title: 'Base64',
    pattern: /^[A-Za-z0-9+/]+={0,2}$/,
  },
];

export interface Parser {
  name: string;
  title: string;
  description?: string;
  length?: number;
  pattern?: RegExp;
  parse?: (s: string) => any;
  generate?: (o?: any) => string;
}

export interface ParseResult {
  parser: Parser;
  raw: string;
  matched: boolean;
  data?: any;
}

export function tryParse(raw: string): ParseResult[] {
  raw = raw.trim();
  const len = raw.length;
  return Parsers.map((parser) => {
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

export function parseIt(raw: string): ParsedIt | undefined {
  raw = raw.trim();
  if (!raw) {
    return;
  }
  const out: ParsedIt = {
    raw,
    type: '',
    maybe: [],
  };
  const len = raw.length;
  // http://www.chinatax.gov.cn/chinatax/n810219/n810744/n2594306/c101700/index.html
  if (len === 18 && USICRegex.test(raw)) {
    out.usci = parseUSCI(raw);
  }
  if (len === 36) {
    try {
      out.ulid = { ...parseULID(raw), raw };
    } catch (e) {
      //
    }
  }

  if (/^[+-][0-9.,]+$/.test(raw)) {
    const n = parseFloat(raw);
    if (!Number.isNaN(n)) {
      out.number = { raw, number: n };
    }
  }

  try {
    const url = new URL(raw);
    out.url = { raw, url };
  } catch (e) {}

  return out;
}

export interface ParsedIt {
  raw: string;
  type: string;

  usci?: ParsedUSCI;
  ulid?: {
    raw: string;
    timestamp: number;
    random: string;
  };
  uuid?: {
    raw: string;
    a: bigint;
    b: bigint;
  };
  ChinaCitizenId?: ChinaCitizenId;
  timestamp?: {
    raw: string;
    timestamp: number;
  };
  number?: {
    raw: string;
    number: number;
  };
  hex?: {
    raw: string;
    string?: string;
    binary: Uint8Array;
  };
  base64?: {
    raw: string;
    string?: string;
    binary: Uint8Array;
  };
  json?: {
    raw: string;
    json: any;
  };
  url?: {
    raw: string;
    url: URL;
  };

  maybe: Array<{
    name: string;
    label: string;
    description?: string;
    data?: Record<string, any>;
  }>;
}
