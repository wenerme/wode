import { IdTypes } from '@src/components/cn/code';
import { ParsedUSCI, parseUsic, USICPrefixRegex } from '@src/components/cn/usic/usic';

const Parsers = [
  {
    type: IdTypes.USCI,
  },
];

export function parseId(s: string): ParsedIdInfo | undefined {
  // http://www.chinatax.gov.cn/chinatax/n810219/n810744/n2594306/c101700/index.html
  if (s.length === 18 && USICPrefixRegex.test(s)) {
    return {
      type: 'id',
      raw: s,
      usci: parseUsic(s),
    };
  }
  return undefined;
}

export interface ParsedIdInfo {
  raw: string;
  type: string;

  usci?: ParsedUSCI;
}
