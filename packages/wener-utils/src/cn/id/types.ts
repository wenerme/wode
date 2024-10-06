/**
 * 居民身份证
 *
 * @see https://en.wikipedia.org/wiki/Resident_Identity_Card
 * @see https://en.wikipedia.org/wiki/Foreign_Permanent_Resident_ID_Card
 */
export interface ResidentIdentityCard {
  // 姓名
  name: string;
  // 性别
  gender: string;
  // 民族
  ethnicity: string;
  // 出生日期
  birthDate: Date;
  // 地址
  domicile: string;
  // 身份证号
  idNumber: string;
  // 签发机关
  issuingAuthority: string;
  // 有效期开始日期
  validStartDate: Date;
  // 有效期结束日期
  validEndDate?: Date;
}
