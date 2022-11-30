import { parseULID } from '@wener/utils';
import { IdTypes } from '@src/components/cn/code';
import { ParsedUSCI, parseUsic, USICRegex } from '@src/components/cn/usic/usic';

const Parsers = [
  {
    type: IdTypes.USCI,
  },
];

export function parseIt(raw: string): ParsedIt | undefined {
  raw = raw.trim();
  if (!raw) {
    return;
  }
  const out: ParsedIt = {
    raw: raw,
    type: '',
  };
  let len = raw.length;
  // http://www.chinatax.gov.cn/chinatax/n810219/n810744/n2594306/c101700/index.html
  if (len === 18 && USICRegex.test(raw)) {
    out.usci = parseUsic(raw);
  }
  if (len === 36) {
    try {
      out.ulid = { ...parseULID(raw), raw: raw };
    } catch (e) {
      //
    }
  }

  if (/^[+-][0-9.,]+$/.test(raw)) {
    let n = parseFloat(raw);
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
}
