export class BusinessLicenseNo {
  static Pattern = /^\d{8}$/;
  static Length = 15; // 2007 之前为 13
  static parse(s: string) {}

  static Descriptor = {
    name: 'BusinessLicenseNo',
    title: '营业执照号',
  };

  constructor(public bureau: string, public sequence: string, public sum: string) {}

  get primary() {
    return this.bureau + this.sequence;
  }

  get valid() {
    return true;
  }
}
