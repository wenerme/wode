// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取用户二次验证信息
 * @see https://developer.work.weixin.qq.com/document/path/99502
 */
export const GetTfaInfoRequestSchema = z.object({
  /** 用户进入二次验证页面时，企业微信颁发的code。每次成员授权带上的code将不一样，code只能使用一次，5分钟未被使用自动过期 */
  code: z.string().min(1),
});
export type GetTfaInfoRequest = z.infer<typeof GetTfaInfoRequestSchema>;
export const GetTfaInfoResponseSchema = z.object({
  /** 成员UserID。若需要获得用户详情信息，可调用通讯录接口：读取成员 */
  userid: z.string().optional(),
  /** 二次验证授权码，开发者可以调用通过二次验证接口，解锁企业微信终端。tfa_code有效期五分钟，且只能使用一次 */
  tfa_code: z.string().optional(),
});
export type GetTfaInfoResponse = z.infer<typeof GetTfaInfoResponseSchema>;

/**
 * 获取访问用户敏感信息
 * @see https://developer.work.weixin.qq.com/document/path/95833
 */
export const GetAuthUserDetailRequestSchema = z.object({
  /** 成员票据 */
  user_ticket: z.string(),
});
export type GetAuthUserDetailRequest = z.infer<typeof GetAuthUserDetailRequestSchema>;
export const GetAuthUserDetailResponseSchema = z.object({
  /** 成员UserID */
  userid: z.string().optional(),
  /** 性别。0表示未定义，1表示男性，2表示女性。仅在用户同意snsapi_privateinfo授权时返回真实值，否则返回0. (0-未定义, 1-男性, 2-女性) */
  gender: z.number().optional(),
  /** 头像url。仅在用户同意snsapi_privateinfo授权时返回真实头像，否则返回默认头像 */
  avatar: z.string().optional(),
  /** 员工个人二维码（扫描可添加为外部联系人），仅在用户同意snsapi_privateinfo授权时返回 */
  qr_code: z.string().optional(),
  /** 手机，仅在用户同意snsapi_privateinfo授权时返回，第三方应用不可获取 */
  mobile: z.string().optional(),
  /** 邮箱，仅在用户同意snsapi_privateinfo授权时返回，第三方应用不可获取 */
  email: z.string().optional(),
  /** 企业邮箱，仅在用户同意snsapi_privateinfo授权时返回，第三方应用不可获取 */
  biz_mail: z.string().optional(),
  /** 地址，仅在用户同意snsapi_privateinfo授权时返回，第三方应用不可获取 */
  address: z.string().optional(),
});
export type GetAuthUserDetailResponse = z.infer<typeof GetAuthUserDetailResponseSchema>;

/**
 * 获取访问用户身份
 * @see https://developer.work.weixin.qq.com/document/path/90492
 */
export const GetUserInfoRequestSchema = z.object({
  /** 通过成员授权获取到的code，最大为512字节。每次成员授权带上的code将不一样，code只能使用一次，5分钟未被使用自动过期 */
  code: z.string().max(512),
});
export type GetUserInfoRequest = z.infer<typeof GetUserInfoRequestSchema>;
export const GetUserInfoResponseSchema = z.object({
  /** 成员UserID。若需要获得用户详情信息，可调用通讯录接口：读取成员。如果是互联企业/企业互联/上下游，则返回的UserId格式如：CorpId/userid */
  userid: z.string().optional(),
  /** 成员票据，最大为512字节，有效期为1800s。scope为snsapi_privateinfo，且用户在应用可见范围之内时返回此参数。后续利用该参数可以获取用 */
  user_ticket: z.string().max(512).optional(),
  /** 非企业成员的标识，对当前企业唯一。不超过64字节 */
  openid: z.string().max(64).optional(),
  /** 外部联系人id，当且仅当用户是企业的客户，且跟进人在应用的可见范围内时返回。如果是第三方应用调用，针对同一个客户，同一个服务商不同应用获取到的id相同 */
  external_userid: z.string().optional(),
});
export type GetUserInfoResponse = z.infer<typeof GetUserInfoResponseSchema>;

/**
 * 使用二次验证
 * @see https://developer.work.weixin.qq.com/document/path/99523
 */
export const SubmitTfaSuccessRequestSchema = z.object({
  /** 用户的userid */
  userid: z.string().min(1),
  /** 获取用户二次验证信息接口返回的tfa_code，五分钟内有效且只能使用一次 */
  tfa_code: z.string().min(1),
});
export type SubmitTfaSuccessRequest = z.infer<typeof SubmitTfaSuccessRequestSchema>;

