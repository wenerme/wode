export class UnifiedSocialCreditId {
  static Length = 16;
  static Pattern = /^([159][1239]|Y1)[0-9]{6}[0-9A-HJ-NP-RTUWXY]{10}$/;

  constructor() {}

  static parse(s: string) {}

  static Descriptor = {
    name: 'USCI',
    fullName: 'Unified Social Credit Identifier',
    title: '统一社会信用代码',
    description:
      '统一社会信用代码是由国家工商行政管理总局于2015年10月1日正式实施的，是国家为了统一社会信用体系而推出的一种新的社会信用代码，是企业法人、其他组织以及社会团体在全国范围内唯一的社会信用代码。',
    link: 'https://zh.wikipedia.org/wiki/统一社会信用代码',
  };

  get valid() {
    return true;
  }
}
