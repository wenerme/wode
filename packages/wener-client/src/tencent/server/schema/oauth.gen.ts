// Code generated from Tencent Docs API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取 Authorization Code（插件快速授权）
 * @see https://docs.qq.com/open/document/app/oauth2/addon_authorize_in.html
 */
export const GetAddonAuthorizeRequestSchema = z.object({
  /** 申请应用时分配的 client_id */
  client_id: z.string(),
  /** 授权回调地址，必须和申请应用时填写的 redirect_uri 在同一个域名下 */
  redirect_uri: z.string(),
  /** 描述获取授权的方式，Authorization Code 方式授权，固定值为 code */
  response_type: z.string(),
  /** 授权的权限集范围，可参考 Scope (OpenAPI 权限集定义) */
  scope: z.string().optional(),
  /** 用于保持请求和回调的状态，授权请求成功后原样带回给第三方，该参数用于防止 CSRF 攻击，强烈建议带上 */
  state: z.string().optional(),
});
export type GetAddonAuthorizeRequest = z.infer<typeof GetAddonAuthorizeRequestSchema>;
export const GetAddonAuthorizeResponseSchema = z.object({
  /** 用来换取 access_token 的授权码，有效期为 10 分钟且只能用一次 */
  code: z.string().optional(),
  /** 如果请求时传递参数，会回传该参数 */
  state: z.string().optional(),
});
export type GetAddonAuthorizeResponse = z.infer<typeof GetAddonAuthorizeResponseSchema>;

/**
 * 获取应用级账号 Token
 * @see https://docs.qq.com/open/document/app/oauth2/app_account_token.html
 */
export const GetAppAccountTokenRequestSchema = z.object({
  /** 申请应用时分配的 client_id */
  client_id: z.string(),
  /** 申请应用时分配的 client_secret */
  client_secret: z.string(),
});
export type GetAppAccountTokenRequest = z.infer<typeof GetAppAccountTokenRequestSchema>;
export const GetAppAccountTokenResponseSchema = z.object({
  /** 应用级账号的访问令牌 */
  access_token: z.string().optional(),
  /** 目前统一返回 Bearer */
  token_type: z.string().optional(),
  /** Access Token 的过期时间，单位为秒 */
  expires_in: z.number().optional(),
  /** 应用级账号的刷新令牌，用于刷新 Access Token（1 年有效期） */
  refresh_token: z.string().optional(),
  /** 应用级账号的唯一标识，也就是 Open ID */
  user_id: z.string().optional(),
  /** Access Token 的权限范围，用逗号分隔 */
  scope: z.string().optional(),
});
export type GetAppAccountTokenResponse = z.infer<typeof GetAppAccountTokenResponseSchema>;

/**
 * 发起授权
 * @see https://docs.qq.com/open/document/app/oauth2/authorize.html
 */
export const AuthorizeRequestSchema = z.object({
  /** 第三方应用唯一标识 */
  client_id: z.string(),
  /** 授权回调地址，需要 URL Encode，后台会校验域名是否在白名单中。仅支持 HTTPS 协议 */
  redirect_uri: z.string(),
  /** 授权方式，此处固定填写 code */
  response_type: z.string(),
  /** 固定为 all */
  scope: z.string(),
  /** 授权成功后原样带回给第三方，该参数用于防 CSRF 攻击，建议带上 */
  state: z.string().optional(),
});
export type AuthorizeRequest = z.infer<typeof AuthorizeRequestSchema>;
export const AuthorizeResponseSchema = z.object({
  /** 用来换取 access_token 的授权码，有效期为 10 分钟且只能用一次 */
  code: z.string().optional(),
  /** 如果请求时传递参数，会回传该参数 */
  state: z.string().optional(),
});
export type AuthorizeResponse = z.infer<typeof AuthorizeResponseSchema>;

/**
 * 获取 Authorization Code（Drive 官方插件快速授权）
 * @see https://docs.qq.com/open/document/app/oauth2/direct_authorize_in.html
 */
export const GetAuthorizationCodeRequestSchema = z.object({
  /** 申请应用时分配的 client_id */
  client_id: z.string(),
  /** 授权回调地址，必须和申请应用时填写的 redirect_uri 在同一个域名下 */
  redirect_uri: z.string(),
  /** 描述获取授权的方式，Authorization Code 方式授权，response_type=code */
  response_type: z.string(),
  /** 授权的权限集范围，可参考 Scope (OpenAPI 权限集定义) */
  scope: z.string().optional(),
  /** 用于保持请求和回调的状态，授权请求成功后原样带回给第三方 */
  state: z.string().optional(),
});
export type GetAuthorizationCodeRequest = z.infer<typeof GetAuthorizationCodeRequestSchema>;
export const GetAuthorizationCodeResponseSchema = z.object({
  /** 用来换取 access_token 的授权码，有效期为 10 分钟且只能用一次 */
  code: z.string().optional(),
  /** 如果请求时传递参数，会回传该参数 */
  state: z.string().optional(),
});
export type GetAuthorizationCodeResponse = z.infer<typeof GetAuthorizationCodeResponseSchema>;

/**
 * 获取 Authorization Code（内部快速授权）
 * @see https://docs.qq.com/open/document/app/oauth2/authorize_in.html
 */
export const GetInnerAuthorizeCodeRequestSchema = z.object({
  /** 申请应用时分配的 client_id */
  client_id: z.string(),
  /** 授权回调地址，必须和申请应用时填写的 redirect_uri 在同一个域名下 */
  redirect_uri: z.string(),
  /** 描述获取授权的方式，Authorization Code 方式授权，response_type=code */
  response_type: z.string(),
  /** 授权的权限集范围 */
  scope: z.string().optional(),
  /** 用于保持请求和回调的状态，授权请求成功后原样带回给第三方，该参数用于防止 CSRF 攻击 */
  state: z.string().optional(),
  /** QQ（微信）为第三方应用颁发的 client_id */
  appid_3rd: z.string(),
  /** 用户通过 QQ（微信）授权第三方应用后，拿到的 Open ID */
  openid_3rd: z.string(),
  /** 用户通过 QQ（微信）授权第三方应用后，拿到的 Access Token */
  accesstoken_3rd: z.string(),
});
export type GetInnerAuthorizeCodeRequest = z.infer<typeof GetInnerAuthorizeCodeRequestSchema>;
export const GetInnerAuthorizeCodeResponseSchema = z.object({
  /** 用来换取 access_token 的授权码，有效期为 10 分钟且只能用一次 */
  code: z.string().optional(),
  /** 如果请求时传递参数，会回传该参数 */
  state: z.string().optional(),
});
export type GetInnerAuthorizeCodeResponse = z.infer<typeof GetInnerAuthorizeCodeResponseSchema>;

export const GetUserHasSecondPasswordResponseSchema = z.object({
  /** 表示是否有二级密码，取值 0/1。1: 有二级密码；0: 没有二级密码 */
  has_pwd: z.number().optional(),
});
export type GetUserHasSecondPasswordResponse = z.infer<typeof GetUserHasSecondPasswordResponseSchema>;

/**
 * 校验用户二次登录密码
 * @see https://docs.qq.com/open/document/app/oauth2/verify_pwd_in.html
 */
export const VerifyUserPasswordRequestSchema = z.object({
  /** 用户输入的二次密码使用 MD5 消息摘要算法计算后的小写十六进制散列值。例如 input_pwd='123456'，pwd_hash='e10adc3949ba */
  pwd_hash: z.string(),
});
export type VerifyUserPasswordRequest = z.infer<typeof VerifyUserPasswordRequestSchema>;

/**
 * 获取 Access Token
 * @see https://docs.qq.com/open/document/app/oauth2/access_token.html
 */
export const GetAccessTokenRequestSchema = z.object({
  /** 第三方应用唯一标识 */
  client_id: z.string(),
  /** 第三方应用的密钥 */
  client_secret: z.string(),
  /** 授权回调地址，必须跟 /oauth/v2/authorize 请求中带的地址一样 */
  redirect_uri: z.string(),
  /** 固定为 authorization_code */
  grant_type: z.string(),
  /** 发起授权成功后拿到的 code */
  code: z.string(),
});
export type GetAccessTokenRequest = z.infer<typeof GetAccessTokenRequestSchema>;
export const GetAccessTokenResponseSchema = z.object({
  /** 用户的访问令牌 */
  access_token: z.string().optional(),
  /** 目前统一返回 Bearer */
  token_type: z.string().optional(),
  /** Access Token 的过期时间，单位为秒 */
  expires_in: z.number().optional(),
  /** 用户的刷新令牌，用于刷新 Access Token（1 年有效期） */
  refresh_token: z.string().optional(),
  /** 用户的唯一标识，也就是 Open ID */
  user_id: z.string().optional(),
  /** Access Token 的权限范围，用逗号分隔 */
  scope: z.string().optional(),
});
export type GetAccessTokenResponse = z.infer<typeof GetAccessTokenResponseSchema>;
