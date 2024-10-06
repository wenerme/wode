export const IdTypes = {
  // 居民身份证号码

  USCI: {
    name: 'USCI',
    fullName: 'Unified Social Credit Identifier',
    label: '统一社会信用代码',
    length: 18,
  },
};

export interface Code {
  label: string;
  codes?: Record<string, Code>;
}
