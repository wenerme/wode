/* 16 位 */
const USCCRegex = /^([159][1239]|Y1)[0-9]{6}[0-9A-HJ-NP-RTUWXY]{10}$/; // I O Z S V

/**
 * USCC - 统一社会信用代码
 */
export function isUSCC(s: string) {
  return USCCRegex.test(s);
}
