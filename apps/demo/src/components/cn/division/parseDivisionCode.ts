import { randomPick } from '../utils/randomPick';
import _Divisions from './divisions.json';

const Divisions: Record<string, string> = _Divisions;

export interface DivisionCode {
  code: string;
  name: string;
  cityCode?: string;
  cityName?: string;
  provinceCode?: string;
  provinceName?: string;
}

export function parseDivisionCode(code: string): DivisionCode | undefined {
  const name = Divisions[code];
  if (!name) {
    return undefined;
  }
  const city = code.slice(0, 4);
  const province = code.slice(0, 2);
  return {
    code,
    name,
    cityCode: city,
    cityName: Divisions[city.padEnd(6, '0')],
    provinceCode: province,
    provinceName: Divisions[province.padEnd(6, '0')],
  };
}

let _keys;

export function randomDivisionCode(): string {
  _keys ||= Object.keys(Divisions);
  return randomPick(_keys);
}
