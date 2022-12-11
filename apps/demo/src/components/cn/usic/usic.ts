import type { Code } from '../code';

export interface ParsedUSCI {
  raw: string;
  // 登记管理部门代码
  registryBureauCode: string;
  registryBureauLabel?: string;
  // 机构类别代码
  registryBureauTypeCode: string;
  registryBureauTypeLabel?: string;
  // 登记管理机关行政区划代码
  registryBureauDistrictCode: string;
  registryBureauDistrictLabel?: string;
  // 主体标识码
  subjectCode: string;
  // 校验码
  checkCode: string;
}

export const USICRegistryBureauCode: Record<string, Code> = {
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
export const USICPrefixRegex = /^[159][1239]|Y1/;
/**
 * 16 位
 */
export const USICRegex = /^([159][1239]|Y1)[0-9]{6}[0-9A-HJ-NP-RTUWXY]{10}$/; // I O Z S V

export function parseUsic(s: string): ParsedUSCI {
  return {
    raw: s,
    registryBureauCode: s[0],
    registryBureauLabel: USICRegistryBureauCode[s[0]]?.label,
    registryBureauTypeCode: s[1],
    registryBureauTypeLabel: USICRegistryBureauCode[s[0]]?.codes?.[s[1]]?.label,
    registryBureauDistrictCode: s.slice(2, 8),
    subjectCode: s.slice(8, 17),
    checkCode: s[17],
  };
}
