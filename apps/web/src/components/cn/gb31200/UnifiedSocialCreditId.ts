import { DivisionCode } from '@wener/utils/cn';
import { randomPick } from '../utils/randomPick';
import { mod31, Mod31Chars, Mode31Numbers } from './mod31';

const RegistryBureauCode: Record<string, BureauCode> = {
  1: {
    label: '机构编制',
    codes: {
      1: { label: '机关' },
      2: { label: '事业单位' },
      3: { label: '中央编办直接管理机构编制的群众团体' },
      9: { label: '其他' },
    },
  },
  5: {
    label: '民政',
    codes: {
      1: { label: '社会团体' },
      2: { label: '民办非企业单位' },
      3: { label: '基金会' },
      9: { label: '其他' },
    },
  },
  9: {
    label: '工商',
    codes: {
      1: { label: '企业' },
      2: { label: '个体工商户' },
      3: { label: '农民专业合作社' },
      9: { label: '其他' },
    },
  },
  Y: {
    label: '其他',
    codes: {
      1: { label: '其他' },
    },
  },
};

export class UnifiedSocialCreditId {
  static Length = 18;
  static Pattern = /^([159][1239]|Y1)[0-9]{6}[0-9A-HJ-NP-RTUWXY]{10}$/;

  constructor(
    // 登记管理部门代码
    public bureau: string,
    // 机构类别代码
    public subtype: string,
    // 登记管理机关行政区划代码
    public division: string,
    // 主体标识码
    public subject: string,
    // 校验码
    public sum: string,
  ) {}

  get bureauLabel() {
    return RegistryBureauCode[this.bureau]?.label;
  }

  get bureauSubtypeLabel() {
    return RegistryBureauCode[this.bureau]?.codes?.[this.subtype]?.label;
  }

  static isValid(s: string) {
    return this.Pattern.test(s) && this.parse(s).valid;
  }

  static parse(s: string) {
    if (!UnifiedSocialCreditId.Pattern.test(s)) {
      throw new Error('Invalid Unified Social Credit Id');
    }
    const bureau = s.slice(0, 1);
    const type = s.slice(1, 2);
    const division = s.slice(2, 8);
    const subject = s.slice(8, 17);
    const sum = s.slice(17);
    return new UnifiedSocialCreditId(bureau, type, division, subject, sum);
  }

  static random() {
    const bureau = randomPick(Object.keys(RegistryBureauCode));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const type = randomPick(Object.keys(RegistryBureauCode[bureau].codes!));
    const division = DivisionCode.random('County');
    const subject = new Array(9)
      .fill(0)
      .map(() => Mod31Chars[Math.floor(Math.random() * 31)])
      .join('');
    const sum = mod31([bureau, type, division, subject].join(''));
    return new UnifiedSocialCreditId(bureau, type, division, subject, sum);
  }

  static Descriptor = {
    name: 'USCI',
    fullName: 'Unified Social Credit Identifier',
    title: '统一社会信用代码',
    description:
      '统一社会信用代码是由国家工商行政管理总局于2015年10月1日正式实施的，是国家为了统一社会信用体系而推出的一种新的社会信用代码，是企业法人、其他组织以及社会团体在全国范围内唯一的社会信用代码。',
    link: 'https://zh.wikipedia.org/wiki/统一社会信用代码',
  };

  static RegistryBureauCode = RegistryBureauCode;

  get valid() {
    return this.sum === mod31(this.primary);
  }

  get primary() {
    return this.bureau + this.subtype + this.division + this.subject;
  }

  next() {
    const id = new UnifiedSocialCreditId(this.bureau, this.subtype, this.division, next(this.subject, +1), this.sum);
    id.sum = mod31(id.primary);
    return id;
  }

  prev() {
    const id = new UnifiedSocialCreditId(this.bureau, this.subtype, this.division, next(this.subject, -1), this.sum);
    id.sum = mod31(id.primary);
    return id;
  }

  toString() {
    return this.primary + this.sum;
  }
}

export interface BureauCode {
  label: string;
  codes?: Record<string, BureauCode>;
}

export function next(s: string, delta: number) {
  const sp = s.split('').map((v) => Mode31Numbers[v]);
  for (let i = sp.length - 1; i >= 0; i--) {
    if ((delta > 0 && sp[i] < 30) || (delta < 0 && sp[i] > 0)) {
      sp[i] += delta;
      break;
    } else if (delta > 0 && sp[i] === 30) {
      sp[i] = 0;
    } else if (delta < 0 && sp[i] === 0) {
      sp[i] = 30;
    }
  }
  return sp.map((v) => Mod31Chars[v]).join('');
}
