import { formatDate } from './formatDate';
import { Mod11Checksum } from './Mod11Checksum';

export namespace ResidentIdentityCardNumber {
  export const Checksum = new Mod11Checksum();

  /*
  export const length = 18;
  export const pattern = /^\d{6}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/;
   */

  export function parse(s: string): ParsedResidentIdentityCardNumber {
    const division = s.slice(0, 6);
    const birthDate = s.slice(6, 14);
    const sequence = parseInt(s.slice(14, 17), 10);
    const checksum = s.slice(17, 18);
    const valid = Checksum.validate(s);
    const sex = sequence % 2 === 1 ? 'Male' : 'Female';
    return {
      division,
      birthDate,
      sequence,
      checksum,
      valid,
      sex,
      male: sex === 'Male',
      female: sex === 'Female',
      age: new Date().getFullYear() - parseInt(birthDate.slice(0, 4), 10),
    };
  }

  export function format({
    division,
    birthDate,
    sequence,
    checksum,
  }: {
    division: string;
    birthDate: string | Date;
    sequence: number | string;
    checksum?: string;
  }) {
    if (typeof birthDate !== 'string') {
      birthDate = formatDate(birthDate, 'yyyyMMDD');
    }
    if (birthDate.includes('-')) {
      birthDate = birthDate.replace(/-/g, '');
    }
    typeof sequence === 'number' && (sequence = sequence.toString());
    sequence = sequence.padStart(3, '0');
    const base = [division, birthDate, sequence].join('');
    if (base.length !== 17) throw new Error('Invalid params');
    checksum ||= Checksum.compute(base);
    return base + checksum;
  }
}
export interface ParsedResidentIdentityCardNumber {
  /**
   * @title 行政区划代码
   */
  division: string;
  /**
   * @title 出生日期
   * 格式 yyyyMMDD
   */
  birthDate: string;
  /**
   * @title 顺序码
   */
  sequence: number;
  /**
   * @title 校验位
   */
  checksum: string;

  /**
   * @title 是否有效
   */
  valid: boolean;
  /**
   * @title 是否男性
   */
  male: boolean;
  /**
   * @title 是否女性
   */
  female: boolean;
  /**
   * @title 性别
   */
  sex: 'Male' | 'Female';
  /**
   * @title 年龄
   */
  age: number;
}
