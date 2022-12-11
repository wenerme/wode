import type { ParsedUSCI } from '@src/components/cn/usic/usic';
import { parseUsic, USICRegex } from '@src/components/cn/usic/usic';
import { parseULID } from '@wener/utils';

const Parsers: Parser[] = [
  {
    // wrV_AAAAAA0A0AAaAaaAaAAaaaAA-aaa
    name: 'WecomRoomIdFromWechat',
    label: 'Wecom Room ID from Wechat',
    // 28+4
    length: 32,
    pattern: /^wrV_[-a-zA-Z0-9]{28}$/,
  },
  {
    name: 'WecomMemberIdFromWechat',
    label: 'Wecom Member ID from Wechat',
    length: 32,
    pattern: /^wmV_[-a-zA-Z0-9]{28}$/,
  },
  {
    name: 'WecomRoomId',
    label: 'Wecom Room ID',
    length: 32,
    pattern: /^wr[-a-zA-Z0-9]{30}$/,
  },
  {
    name: 'WecomMemberId',
    label: 'Wecom Member ID',
    length: 32,
    pattern: /^wm[-a-zA-Z0-9]{30}$/,
  },
  {
    name: 'WecomCorpID',
    label: 'Wecom Corp ID/Suit ID',
    length: 32,
    pattern: /^ww[a-zA-Z0-9]{16}$/,
  },
  // wecom - wo OpenId, tj 早期套件
  {
    name: 'USIC',
    label: '中国统一信用代码',
    length: 18,
    pattern: USICRegex,
    parse: parseUsic,
  },
  {
    name: 'ULID',
    label: 'ULID',
    length: 26,
    pattern: /^[0-9A-HJKMNP-TV-Z]{26}$/i,
    parse: parseULID,
  },
  {
    name: 'UUID',
    label: 'UUID',
    length: 36,
    pattern: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
  },
  {
    name: 'JsonObject',
    label: 'JSON Object',
    pattern: /^\{.*}$/,
    parse: (s) => JSON.parse(s),
  },
  {
    name: 'URL',
    label: 'URL',
    pattern: /^https?:\/\//i,
    parse: (s) => new URL(s),
  },
  // URI
  {
    name: 'Integer',
    label: '整数',
    pattern: /^[-+]?\d+(e\d+)?$/,
  },
  {
    name: 'Timestamp',
    label: '时间戳',
    pattern: /^\d{10,13}$/,
  },
  {
    name: 'Binary',
    label: '二进制',
    pattern: /^(0[bB])?[01]+$/,
  },
  {
    name: 'Octal',
    label: '八进制',
    pattern: /^(0[oO])?[0-7]+$/,
  },
  {
    name: 'Hex',
    label: 'Hex',
    pattern: /^(0x)?[0-9A-F]+$/i,
  },
  {
    name: 'Base32',
    label: 'Base32',
    pattern: /^[A-Z2-7]+$/i,
  },
  {
    name: 'Base64',
    label: 'Base64',
    pattern: /^[A-Za-z0-9+/]+={0,2}$/,
  },
];

export interface Parser {
  name: string;
  label: string;
  description?: string;
  length?: number;
  pattern?: RegExp;
  parse?: (s: string) => any;
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
    out.usci = parseUsic(raw);
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
  ChinaCitizenIdNo?: {
    raw: string;
    date: Date;
    gender: 'female' | 'male';
    districtCode: string;
    checkCode: string;
  };
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
