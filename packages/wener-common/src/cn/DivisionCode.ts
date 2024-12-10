const DivisionCodeLevels: Array<{
  level: number;
  code: string;
  length: number;
  size: number;
  label: string;
}> = [
  {
    level: 1,
    code: 'Province',
    length: 2,
    size: 2,
    label: '省',
  },
  {
    level: 2,
    code: 'City',
    length: 4,
    size: 2,
    label: '市',
  },
  {
    level: 3,
    code: 'County',
    length: 6,
    size: 2,
    label: '区县',
  },
  {
    level: 4,
    code: 'Town',
    length: 9,
    size: 3,
    label: '乡镇',
  },
  {
    level: 5,
    code: 'Village',
    length: 12,
    size: 3,
    label: '村',
  },
] as const;

// String(Number.MAX_SAFE_INTEGER).length=16
// 12 is safe int

/**
 * Codes for the administrative divisions of the People's Republic of China
 *
 * @see https://zh.wikipedia.org/wiki/GB/T_2260 中华人民共和国行政区划代码
 */
export namespace DivisionCode {
  enum DivisionCodeLevel {
    Province = 1,
    City = 2,
    County = 3,
    Town = 4,
    Village = 5,
  }

  export const levels = DivisionCodeLevels;

  export const regex = /^(?<province>\d{2})(?<city>\d{2})?(?<county>\d{2})?(?<town>\d{3})?(?<village>\d{3})?$/;

  const root: CodeValue[] = [
    { value: '11', label: '北京市' },
    { value: '12', label: '天津市' },
    { value: '13', label: '河北省' },
    { value: '14', label: '山西省' },
    { value: '15', label: '内蒙古自治区' },
    { value: '21', label: '辽宁省' },
    { value: '22', label: '吉林省' },
    { value: '23', label: '黑龙江省' },
    { value: '31', label: '上海市' },
    { value: '32', label: '江苏省' },
    { value: '33', label: '浙江省' },
    { value: '34', label: '安徽省' },
    { value: '35', label: '福建省' },
    { value: '36', label: '江西省' },
    { value: '37', label: '山东省' },
    { value: '41', label: '河南省' },
    { value: '42', label: '湖北省' },
    { value: '43', label: '湖南省' },
    { value: '44', label: '广东省' },
    { value: '45', label: '广西壮族自治区' },
    { value: '46', label: '海南省' },
    { value: '50', label: '重庆市' },
    { value: '51', label: '四川省' },
    { value: '52', label: '贵州省' },
    { value: '53', label: '云南省' },
    { value: '54', label: '西藏自治区' },
    { value: '61', label: '陕西省' },
    { value: '62', label: '甘肃省' },
    { value: '63', label: '青海省' },
    { value: '64', label: '宁夏回族自治区' },
    { value: '65', label: '新疆维吾尔自治区' },
    { value: '71', label: '台湾省' },
    { value: '81', label: '香港特别行政区' },
    { value: '82', label: '澳门特别行政区' },
    // 9 国外
  ];

  export type ParsedCode = {
    province: string;
    city?: string;
    county?: string;
    town?: string;
    village?: string;
    codes: string[];
    level: DivisionCodeLevel;
    labels: string[];
  };

  export function parse(code: string | undefined | null | number): ParsedCode | undefined {
    if (!code) return;
    code = String(code);
    const match = regex.exec(code);
    if (!match) return;
    const { province, city, county, town, village } = match.groups ?? {};
    if (!province) return;

    let codes = [province, city, county, town, village].filter(Boolean);
    return {
      province,
      city,
      county,
      town,
      village,
      codes: codes,
      level: codes.length as DivisionCodeLevel,
    };
  }

  export function format({
    province,
    city,
    county,
    town,
    village,
  }: {
    province: string | number;
    city?: string | number;
    county?: string | number;
    town?: string | number;
    village?: string | number;
  }): string {
    const codes: string[] = [];
    for (let i = 0; i < [province, city, county, town, village].length; i++) {
      let x = [province, city, county, town, village][i];
      if (x === undefined || x === null || x === '') {
        break;
      }
      let len = levels[i].size;
      codes.push(String(x).padStart(len, '0').slice(0, len));
    }
    return codes.join('');
  }

  // export function random(level: DivisionCodeLevel = 'County'): string {
  //   const l = DivisionCodeLevels.find((v) => v.code === level) || DivisionCodeLevels[2];
  //   const l1 = randomPick(provinces);
  //   if (l.level === 1) {
  //     return String(l1[0]);
  //   }
  //   return l1 + String(Math.floor(Math.random() * parseFloat(`1e${l.length - 2}`) - 1));
  // }
}

interface DivisionTreeNode {
  sub: string; // sub code
  children?: Record<string, DivisionTreeNode>;

  code: string; // full code
  name?: string; // name of division
}

// export type DivisionCodeLevel = 'Village' | 'Town' | 'County' | 'City' | 'Province';

// export interface ParsedDivisionCode {
//   level: DivisionCodeLevel;
//   code: string;
//   name?: string;
//   fullName?: string;
//   names: string[];
//   // 村级（村委会、居委会）
//   // 12 位
//   village?: CodeName;
//   // 乡级（乡镇、街道）
//   // 9 位
//   town?: CodeName;
//   // 县级（区县）
//   // 6 位 - 常用 - 2985 个
//   county?: CodeName;
//   // 地级（城市）
//   // 4 位 - 343 个
//   city?: CodeName;
//   // 省级（省份、直辖市、自治区）
//   // 2 位 - 32 个
//   province: CodeName;
//
//   children?: Array<{ code: string; name?: string }>;
// }

// export interface CodeName {
//   code: string;
//   name: string;
// }

// export function getSimpleProvinceLabel(value: string) {
//   if (!value) {
//     return;
//   }
//   let label = value;
//   if (/[0-9]/.test(label)) {
//     label = label.slice(0, 2);
//     label = options.find((v) => v.value === label)?.label || label;
//   }
//   return label.replace(/省|市|(回族|维吾尔|壮族)?自治区|特别行政区$/, '');
// }

export function randomPick<T>(s: T[]) {
  return s[Math.floor(Math.random() * s.length)];
}

function lookup(opts: { values: string[]; root: CodeValue[] }): { found: CodeValue[] } {
  const { values, root } = opts;
  const found: CodeValue[] = [];
  let currentLevel = root;

  for (const v of values) {
    const node = currentLevel.find((n) => n.value === v);
    if (!node) {
      break;
    }

    found.push(node);

    if (node.children) {
      currentLevel = node.children;
    } else {
      break;
    }
  }

  return { found };
}

interface CodeValue {
  value: string;
  label: string;
  children?: Array<CodeValue>;
}
