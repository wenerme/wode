import { Mod11 } from './Mod11';

class ResidentIdNumberFormat {
  checksum = Mod11;

  // 9 https://zh.wikipedia.org/wiki/中华人民共和国外国人永久居留身份证
  // 9 标识码
  // 申领地代码 - 2 位行政区划
  // 国籍国代码 - 3 位数字 https://zh.wikipedia.org/wiki/ISO_3166-1数字代码

  regex =
    /^(?<division>[1-9]\d{5})(?<year>18|19|20)\d{2}(?<month>0[1-9]|1[0-2])(?<day>0[1-9]|[12]\d|3[01])(?<sequence>\d{3})(?<checksum>[0-9Xx])$/;

  validate(s: string) {
    if (!s) return false;
    return this.regex.test(s) && this.checksum.validate(s.toUpperCase());
  }

  generate(opts: { sex?: 'Male' | 'Female'; age?: number; birthDate?: Date; division?: string }) {}

  parse(s: string): IdNumber | undefined {
    if (!this.validate(s)) {
      return;
    }

    let date = s.slice(6, 14);
    let y = parseInt(date.slice(0, 4));
    let m = parseInt(date.slice(4, 6));
    let d = parseInt(date.slice(6));
    return new IdNumber(
      s.slice(0, 6),
      // new Date(`${y}-${m}-${d}`), // YYYYMMDD
      new Date(Date.UTC(y, m - 1, d)), // 避免时区问题
      parseInt(s.slice(14, 17)),
      s.slice(17, 18).toUpperCase(),
    );
  }
}

interface ParseResidentIdNumberResult {
  division: string;
  birthDate: Date;
  sequence: number;
  checksum: string;

  valid: boolean;
  male: boolean;
  female: boolean;
  sex: 'Male' | 'Female';
  age: number;
}

class IdNumber {
  constructor(
    public division: string,
    public birthDate: Date,
    public sequence: number,
    public checksum: string,
  ) {}

  toString() {
    return this.base + this.checksum;
  }

  toJSON() {
    return this.toString();
  }

  toObject(): ParseResidentIdNumberResult {
    const { division, birthDate, sequence, checksum, age, valid, male, female, sex } = this;
    return {
      division,
      birthDate,
      sequence,
      checksum,
      age,
      valid,
      male,
      female,
      sex,
    };
  }

  get valid() {
    return ResidentIdNumber.validate(this.toString());
  }

  get male() {
    return this.sequence % 2 === 1;
  }

  get female() {
    return this.sequence % 2 === 0;
  }

  get age() {
    return new Date().getFullYear() - this.birthDate.getFullYear();
  }

  get sex(): 'Male' | 'Female' {
    return this.sequence % 2 === 1 ? 'Male' : 'Female';
  }

  /**
   * base for checksum
   * @private
   */
  private get base() {
    return [this.division, formatDate(this.birthDate, 'YYYYMMDD'), this.sequence.toString().padStart(3, '0')].join('');
  }
}

function formatDate(date: Date, format = 'YYYYMMDD') {
  switch (format) {
    case 'YYYYMMDD': {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}${month}${day}`;
    }
    default:
      throw new Error(`Invalid format`);
  }
}

export const ResidentIdNumber = new ResidentIdNumberFormat();
