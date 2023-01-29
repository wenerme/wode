import { randomPick } from '../utils/randomPick';
import { ProvinceCodes } from './dataset.gen';
import { getDivisionTable } from './table';
import { type DivisionCodeLevel } from './types';

export interface ParsedDivisionCode {
  level: DivisionCodeLevel;
  code: string;
  names: string[];
  // 村级（村委会、居委会）
  // 12 位
  village?: CodeName;
  // 乡级（乡镇、街道）
  // 9 位
  town?: CodeName;
  // 县级（区县）
  // 6 位 - 常用 - 2985 个
  county?: CodeName;
  // 地级（城市）
  // 4 位 - 343 个
  city?: CodeName;
  // 省级（省份、直辖市、自治区）
  // 2 位 - 32 个
  province: CodeName;
}

export interface CodeName {
  code: string;
  name: string;
}

const DivisionCodeLevels = {
  province: {
    level: 1,
    code: 'province',
    length: 2,
  },
  city: {
    level: 2,
    code: 'city',
    length: 4,
  },
  county: {
    level: 3,
    code: 'county',
    length: 6,
  },
  town: {
    level: 4,
    code: 'town',
    length: 9,
  },
  village: {
    level: 5,
    code: 'village',
    length: 12,
  },
} as const;

export function parseDivisionCode(code: string | number): ParsedDivisionCode | undefined {
  const table = getDivisionTable();
  if (typeof code === 'string') {
    code = parseInt(code, 10);
  }
  if (!code || code < 10) {
    return undefined;
  }
  // normalize
  const parts = split(String(code).padEnd(12, '0'));
  const normalized = parts.join('');
  const l = Object.values(DivisionCodeLevels).find((l) => l.length === normalized.length)!;
  const provinceCode = normalized.slice(0, 2);
  const out: ParsedDivisionCode = {
    level: l.code,
    code: normalized,
    names: [],
    province: {
      code: provinceCode,
      name: table.get(parseInt(provinceCode, 10))?.name || '',
    },
  };

  const { level } = l;
  if (level >= DivisionCodeLevels.city.level) {
    const cityCode = normalized.slice(0, 4);
    out.city = {
      code: cityCode,
      name: table.get(parseInt(cityCode, 10))?.name || '',
    };
  }
  if (level >= DivisionCodeLevels.county.level) {
    const countyCode = normalized.slice(0, 6);
    out.county = {
      code: countyCode,
      name: table.get(parseInt(countyCode, 10))?.name || '',
    };
  }
  if (level >= DivisionCodeLevels.town.level) {
    const townCode = normalized.slice(0, 9);
    out.town = {
      code: townCode,
      name: table.get(parseInt(townCode, 10))?.name || '',
    };
  }
  if (level >= DivisionCodeLevels.village.level) {
    const villageCode = normalized.slice(0, 12);
    out.village = {
      code: villageCode,
      name: table.get(parseInt(villageCode, 10))?.name || '',
    };
  }
  out.names = [out.province.name, out.city?.name, out.county?.name, out.town?.name, out.village?.name].filter(
    Boolean,
  ) as string[];
  return out;
}

export function randomDivisionCode(level: DivisionCodeLevel = 'county'): string {
  const l = DivisionCodeLevels[level];
  const l1 = randomPick(ProvinceCodes);
  if (l.level === 1) {
    return l1;
  }
  return l1 + String(Math.floor(Math.random() * parseFloat(`1e${l.length - 2}`) - 1));
}

export function split(code: string | number) {
  code = String(code);
  return [
    //
    code.slice(0, 2),
    code.slice(2, 4),
    code.slice(4, 6),
    code.slice(6, 9),
    code.slice(9),
  ].filter((v) => parseInt(v));
}
