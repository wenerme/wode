import { Mod31Checksum } from './Mod31Checksum';

/**
 * 统一社会信用代码
 *
 * - GB 11714-1997 全国组织机构代码编制规则
 */
export namespace UnifiedSocialCreditCode {
  interface CodeValue {
    label: string;
    children?: Record<string, CodeValue>;
  }

  const CodeLabels: Record<string, CodeValue> = {
    1: {
      label: '机构编制',
      children: {
        1: { label: '机关' },
        2: { label: '事业单位' },
        3: { label: '中央编办直接管理机构编制的群众团体' },
        9: { label: '其他' },
      },
    },
    5: {
      label: '民政',
      children: {
        1: { label: '社会团体' },
        2: { label: '民办非企业单位' },
        3: { label: '基金会' },
        9: { label: '其他' },
      },
    },
    9: {
      label: '工商',
      children: {
        1: { label: '企业' },
        2: { label: '个体工商户' },
        3: { label: '农民专业合作社' },
        9: { label: '其他' },
      },
    },
    Y: {
      label: '其他',
      children: {
        1: { label: '其他' },
      },
    },
  };

  export const pattern = /^([159][1239]|Y1)[0-9]{6}[0-9A-HJ-NP-RTUWXY]{10}$/; // 无 I O Z S V

  export const Checksum = new Mod31Checksum();

  export function parse(s: string): ParsedUnifiedSocialCreditCode {
    let bureau = s[0];
    let subjectType = s[1];
    let division = s.slice(2, 8); // 第3~8位，共6位，正确
    let subject = s.slice(8, 17); // 第9~17位，共9位
    let checksum = s.slice(17, 18); // 第18位，校验码

    const labels: string[] = [];
    let l1 = CodeLabels[bureau];
    l1 && labels.push(l1?.label);
    let l2 = l1?.children?.[subjectType];
    l2 && labels.push(l2?.label);

    return {
      bureau,
      subjectType,
      division,
      subject,
      checksum,
      codes: [bureau, subjectType, division, subject],
      labels,
    };
  }

  export function format({
    bureau,
    subjectType,
    division,
    subject,
    checksum,
  }: {
    bureau: string;
    subjectType: string;
    division: string;
    subject: string;
    checksum?: string;
  }): string {
    const base = `${bureau}${subjectType}${division}${subject}`;
    checksum ||= Checksum.compute(base);
    return `${base}${checksum}`;
  }

  export function next(s: string, delta: number = 1) {
    const sp = s.split('').map((v) => Checksum.numbers[v]);
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
    return sp.map((v) => Checksum.chars[v]).join('');
  }
}

/**
 * 解析后的统一社会信用代码信息
 */
interface ParsedUnifiedSocialCreditCode {
  /**
   * @title 登记管理部门代码
   * 对应统一社会信用代码的第1位字符，用于标识发证机构类别（登记管理部门）。
   */
  bureau: string;

  /**
   * @title 机构类别代码
   * 对应统一社会信用代码的第2位字符，用于标识被赋码主体的类型（如企业、事业单位、社会组织等）。
   */
  subjectType: string;

  /**
   * @title 登记管理机关行政区划代码
   * 对应统一社会信用代码的第3至第8位字符，用于标识该主体登记机关所在的行政区划。
   */
  division: string;

  /**
   * @title 主体标识码
   * 对应统一社会信用代码的第9至第17位字符，用于标识特定的市场主体或法人单位。
   */
  subject: string;

  /**
   * @title 校验码
   * 对应统一社会信用代码的最后一位字符，用特定算法计算，用于校验代码有效性。
   */
  checksum: string;

  codes: string[];
  labels: string[];
}
