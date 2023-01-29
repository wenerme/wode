import { randomPick } from '../utils/randomPick';
import { ProvinceCodes } from './dataset.gen';
import { getDivisionTable } from './table';
import { DivisionCodeLevel } from './types';

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
    length: 2,
  },
  city: {
    level: 2,
    length: 4,
  },
  county: {
    level: 3,
    length: 6,
  },
  town: {
    level: 4,
    length: 9,
  },
  village: {
    level: 5,
    length: 12,
  },
} as const;

export function parseDivisionCode(code: string | number): ParsedDivisionCode | undefined {
  let table = getDivisionTable();
  if (typeof code === 'string') {
    code = parseInt(code, 10);
  }
  if (!code || code < 10) {
    return undefined;
  }
  const full = String(code).padEnd(12, '0').slice(0, 12);
  const zeros = full.match(/0+$/)?.[0].length || 0;
  let levelCode: DivisionCodeLevel;
  if (zeros < 3) {
    levelCode = 'village';
  } else if (zeros < 6) {
    levelCode = 'town';
  } else if (zeros < 8) {
    levelCode = 'county';
  } else if (zeros < 10) {
    levelCode = 'city';
  } else {
    levelCode = 'province';
  }

  const out: ParsedDivisionCode = {
    level: levelCode,
    code: String(code),
    names: [],
    province: {
      code: full.slice(0, 2),
      name: table.get(parseInt(full.slice(0, 2), 10))?.name || '',
    },
  };

  const { level } = DivisionCodeLevels[levelCode];
  if (level >= DivisionCodeLevels.city.level) {
    out.city = {
      code: full.slice(0, 4),
      name: table.get(parseInt(full.slice(0, 4), 10))?.name || '',
    };
  }
  if (level >= DivisionCodeLevels.county.level) {
    out.county = {
      code: full.slice(0, 6),
      name: table.get(parseInt(full.slice(0, 6), 10))?.name || '',
    };
  }
  if (level >= DivisionCodeLevels.town.level) {
    out.town = {
      code: full.slice(0, 9),
      name: table.get(parseInt(full.slice(0, 9), 10))?.name || '',
    };
  }
  if (level >= DivisionCodeLevels.village.level) {
    out.village = {
      code: full.slice(0, 12),
      name: table.get(parseInt(full.slice(0, 12), 10))?.name || '',
    };
  }
  out.names = [out.province.name, out.city?.name, out.county?.name, out.town?.name, out.village?.name].filter(
    Boolean,
  ) as string[];
  return out;
}

export function randomDivisionCode(level: DivisionCodeLevel = 'county'): string {
  let l = DivisionCodeLevels[level];
  let l1 = randomPick(ProvinceCodes);
  if (l.level === 1) {
    return l1;
  }
  return l1 + String(Math.floor(Math.random() * parseFloat(`1e${l.length - 2}`) - 1));
}
