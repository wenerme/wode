/**
 * 居民身份证
 *
 * @see https://en.wikipedia.org/wiki/Resident_Identity_Card
 * @see https://en.wikipedia.org/wiki/Foreign_Permanent_Resident_ID_Card
 */
export interface ResidentIdentityCardInfo {
  /**
   * @title 姓名
   */
  name: string;
  /**
   * @title 性别
   */
  sex: 'Male' | 'Female';
  /**
   * @title 民族
   * 例如 '汉'/'满'/'回'
   */
  ethnicity: string;
  /**
   * @title 出生日期
   * @format date
   */
  birthDate: string;
  /**
   * @title 地址
   *
   * - 通常为 domicile/户籍地
   */
  address: string;
  /**
   * @title 身份证号
   */
  identityCardNumber: string;
  /**
   * @title 签发机关
   */
  issuer: string;
  /**
   * @title 有效期开始日期
   * @format date
   */
  validStartDate: string;
  /**
   * @title 有效期结束日期
   * @format date
   * @description 如长期有效则为 空
   */
  validEndDate?: string;
}
