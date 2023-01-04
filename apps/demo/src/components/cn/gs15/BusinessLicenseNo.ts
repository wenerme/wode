export class BusinessLicenseNo {
  static Pattern = /^\d{8}$/;
  static Length = 15; // 2007 之前为 13
  static parse(s: string) {
    if (!BusinessLicenseNo.Pattern.test(s)) {
      throw new Error('Invalid BusinessLicenseNo');
    }
    const bureau = s.slice(0, 6);
    const sequence = s.slice(6, 8);
    const sum = s.slice(8, 9);
    return new BusinessLicenseNo(bureau, sequence, sum);
  }

  static Descriptor = {
    name: 'BusinessLicenseNo',
    title: '营业执照号(15位)',
  };

  constructor(public bureau: string, public sequence: string, public sum: string) {}

  get primary() {
    return this.bureau + this.sequence;
  }

  get valid() {
    return true;
  }
}
