import { randomPick } from '../utils/randomPick';

export interface DivisionCode {
  code: string;
  name: string;
  cityCode?: string;
  cityName?: string;
  provinceCode?: string;
  provinceName?: string;
}

export function parseDivisionCode(divisions: Record<string, string>, code: string): DivisionCode | undefined {
  const name = divisions[code];
  if (!name) {
    return undefined;
  }
  const city = code.slice(0, 4);
  const province = code.slice(0, 2);
  return {
    code,
    name,
    cityCode: city,
    cityName: divisions[city.padEnd(6, '0')],
    provinceCode: province,
    provinceName: divisions[province.padEnd(6, '0')],
  };
}

let _DivisionCodes: string[];

export function randomDivisionCode(divisions?: Record<string, string>): string {
  if (!divisions || !_DivisionCodes) {
    return String(Math.floor(Math.random() * 999999));
  }
  _DivisionCodes ||= Object.keys(divisions);
  return randomPick(_DivisionCodes);
}
