export class UnifiedSocialCreditId {
  static Length = 16;
  static Pattern = /^([159][1239]|Y1)[0-9]{6}[0-9A-HJ-NP-RTUWXY]{10}$/;

  static parse(s: string) {}

  get valid() {
    return true;
  }
}
