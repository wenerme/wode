import { Mod31 } from './Mod31';

/**
 * - GB 32100-2015 法人和其他组织统一社会信用代码编码规则
 * - USCI -> UnifiedSocialCreditIdentifier
 * - USCC -> Unified Social Credit Code - 官方叫法
 * - Business License
 *
 * @see https://en.wikipedia.org/wiki/Unified_Social_Credit_Identifier
 */
export class UnifiedSocialCreditCodeFormat {
  registryCodeLabels: Record<string, Code> = {
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

  /* 16 位 */
  regex = /^([159][1239]|Y1)[0-9]{6}[0-9A-HJ-NP-RTUWXY]{10}$/; // 无 I O Z S V
  checksum = Mod31;

  parse(s: string): ParsedUSCC {
    let registryCode = s[0];
    let l1 = this.registryCodeLabels[registryCode];
    let organizationTypeCode = s[1];
    return {
      registryAuthorityCode: registryCode,
      registryAuthorityCodeLabel: l1?.label,
      organizationTypeCode,
      organizationTypeLabel: l1?.children?.[organizationTypeCode]?.label,
      registryDivisionCode: s.slice(3, 6),
      // GB 11714-1997 全国组织机构代码编制规则
      subject: s.slice(6, 15),
      checksum: s.slice(17, 18),
    };
  }

  validate(s: string) {
    return this.regex.test(s) && this.checksum.validate(s);
  }
}

interface Code {
  label: string;
  children?: Record<string, Code>;
}

interface ParsedUSCC {
  // 登记管理部门码
  registryAuthorityCode: string;
  registryAuthorityCodeLabel?: string;
  // 机构类别代码
  organizationTypeCode: string;
  organizationTypeLabel?: string;
  // 登记管理机关行政区划代码
  registryDivisionCode: string;
  registryDivisionLabel?: string;
  // 主体标识码
  subject: string;
  // 校验码
  checksum: string;
}

export const USCC = new UnifiedSocialCreditCodeFormat();
