// Code generated from WeChat API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 查询Code接口
 * @see https://developers.weixin.qq.com/doc/service/guide/product/card/Managing_Coupons_Vouchers_and_Cards.html
 */
export const GetCardCodeRequestSchema = z.object({
  /** 卡券ID代表一类卡券。自定义code卡券必填。 */
  card_id: z.string().max(32).optional(),
  /** 单张卡券的唯一标准。 */
  code: z.string().max(20),
  /** 是否校验code核销状态，填入true和false时的code异常状态返回数据不同。 */
  check_consume: z.boolean().optional(),
});
export type GetCardCodeRequest = z.infer<typeof GetCardCodeRequestSchema>;
export const GetCardCodeResponseSchema = z.object({
  /** 用户openid */
  openid: z.string().optional(),
  /** 卡券信息对象 */
  card: z.object({ card_id: z.string().max(32), begin_time: z.number(), end_time: z.number() }).optional(),
  /** 是否可以核销，true为可以核销，false为不可核销 */
  can_consume: z.boolean().optional(),
  /** 卡券领取时商户传入的渠道值 */
  outer_str: z.string().optional(),
  /** 当前code对应卡券的状态 NORMAL 正常 CONSUMED 已核销 EXPIRE 已过期 GIFTING 转赠中 GIFT_TIMEOUT 转赠超时 DE (NORMAL-正常, CONSUMED-已核销, EXPIRE-已过期, G */
  user_card_status: z.string().optional(),
});
export type GetCardCodeResponse = z.infer<typeof GetCardCodeResponseSchema>;

/**
 * 拉取会员信息（积分查询）接口
 * @see https://developers.weixin.qq.com/doc/service/guide/product/card/Membership_Cards/Manage_Member_Card.html
 */
export const GetMemberCardUserInfoRequestSchema = z.object({
  /** 查询会员卡的cardid */
  card_id: z.string(),
  /** 所查询用户领取到的code值 */
  code: z.string(),
});
export type GetMemberCardUserInfoRequest = z.infer<typeof GetMemberCardUserInfoRequestSchema>;
export const GetMemberCardUserInfoResponseSchema = z.object({
  /** 用户在本服务号内唯一识别码 */
  openid: z.string().optional(),
  /** 用户昵称 */
  nickname: z.string().optional(),
  /** 会员卡号 */
  membership_number: z.string().optional(),
  /** 积分信息 */
  bonus: z.number().min(0).optional(),
  /** 用户性别 (MALE-男, FEMALE-女) */
  sex: z.string().optional(),
  /** 会员信息 */
  user_info: z.object({ common_field_list: z.array(z.object({ name: z.string(), value: z.string() })), custom_field_list: z.array(z.object({ name: z.string(), value: z.string() })) }).optional(),
  /** 当前用户会员卡状态 (NORMAL-正常, EXPIRE-已过期, GIFTING-转赠中, GIFT_SUCC-转赠成功, GIFT_...) */
  user_card_status: z.string().optional(),
});
export type GetMemberCardUserInfoResponse = z.infer<typeof GetMemberCardUserInfoResponseSchema>;

/**
 * 微信网页授权接口
 * @see https://developers.weixin.qq.com/doc/service/guide/h5/auth.html
 */
export const GetOauth2AccessTokenRequestSchema = z.object({
  /** 服务号的唯一标识 */
  appid: z.string(),
  /** 服务号的appsecret */
  secret: z.string(),
  /** 填写第一步获取的code参数，只能使用一次，5分钟未被使用自动过期 */
  code: z.string(),
  /** 填写为authorization_code (authorization_code-授权码模式) */
  grant_type: z.string(),
});
export type GetOauth2AccessTokenRequest = z.infer<typeof GetOauth2AccessTokenRequestSchema>;
export const GetOauth2AccessTokenResponseSchema = z.object({
  /** 网页授权接口调用凭证，与基础支持的access_token不同 */
  access_token: z.string().optional(),
  /** access_token接口调用凭证超时时间，单位（秒） */
  expires_in: z.number().optional(),
  /** 用户刷新access_token */
  refresh_token: z.string().optional(),
  /** 用户唯一标识，在未关注服务号时，用户访问服务号的网页也会产生一个用户和服务号唯一的OpenID */
  openid: z.string().optional(),
  /** 用户授权的作用域，使用逗号（,）分隔 (snsapi_base-基础授权, snsapi_userinfo-用户信息授权) */
  scope: z.string().optional(),
  /** 是否为快照页模式虚拟账号，只有当用户是快照页模式虚拟账号时返回，值为1 (0-非快照页用户, 1-快照页模式虚拟账号) */
  is_snapshotuser: z.number().optional(),
  /** 用户统一标识（针对一个微信开放平台账号下的应用，同一用户的unionid是唯一的），只有当scope为snsapi_userinfo时返回 */
  unionid: z.string().optional(),
});
export type GetOauth2AccessTokenResponse = z.infer<typeof GetOauth2AccessTokenResponseSchema>;

/**
 * 获取api_ticket
 * @see https://developers.weixin.qq.com/doc/service/guide/h5/jssdk.html
 */
export const GetApiTicketRequestSchema = z.object({
  /** 票据类型，固定为wx_card (wx_card-卡券票据) */
  type: z.string(),
});
export type GetApiTicketRequest = z.infer<typeof GetApiTicketRequestSchema>;
export const GetApiTicketResponseSchema = z.object({
  /** api_ticket，卡券接口中签名所需凭证 */
  ticket: z.string().optional(),
  /** 有效时间（秒），通常为7200 */
  expires_in: z.number().min(0).default(7200).optional(),
});
export type GetApiTicketResponse = z.infer<typeof GetApiTicketResponseSchema>;
