// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

export const GetApiDomainIpResponseSchema = z.object({
  /** 企业微信服务器IP段 */
  ip_list: z.array(z.string()).optional(),
});
export type GetApiDomainIpResponse = z.infer<typeof GetApiDomainIpResponseSchema>;

export const GetCallbackIpResponseSchema = z.object({
  /** 企业微信服务器IP段列表 */
  ip_list: z.array(z.string()).optional(),
});
export type GetCallbackIpResponse = z.infer<typeof GetCallbackIpResponseSchema>;

/**
 * 获取access_token
 * @see https://developer.work.weixin.qq.com/document/path/90501
 */
export const GetTokenRequestSchema = z.object({
  /** 企业ID */
  corpid: z.string(),
  /** 应用的凭证密钥，应用需是启用状态 */
  corpsecret: z.string(),
});
export type GetTokenRequest = z.infer<typeof GetTokenRequestSchema>;
export const GetTokenResponseSchema = z.object({
  /** 获取到的凭证，最长为512字节 */
  access_token: z.string().max(512).optional(),
  /** 凭证有效时间（秒），通常为7200 */
  expires_in: z.number().optional(),
});
export type GetTokenResponse = z.infer<typeof GetTokenResponseSchema>;

