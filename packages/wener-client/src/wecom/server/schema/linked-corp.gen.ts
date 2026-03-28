// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取下级/下游企业的access_token
 * @see https://developer.work.weixin.qq.com/document/path/95313
 */
export const GetCorpGroupTokenRequestSchema = z.object({
  /** 已授权的下级/下游企业corpid */
  corpid: z.string().min(1),
  /** 填0则为企业互联/局校互联，填1则表示上下游企业 (0-企业互联/局校互联, 1-上下游企业) */
  business_type: z.number().optional(),
  /** 已授权的下级/下游企业应用ID */
  agentid: z.number().min(1),
});
export type GetCorpGroupTokenRequest = z.infer<typeof GetCorpGroupTokenRequestSchema>;
export const GetCorpGroupTokenResponseSchema = z.object({
  /** 获取到的下级/下游企业调用凭证 */
  access_token: z.string().max(512).optional(),
  /** 凭证的有效时间（秒） */
  expires_in: z.number().optional(),
});
export type GetCorpGroupTokenResponse = z.infer<typeof GetCorpGroupTokenResponseSchema>;

/**
 * 获取下级/下游企业小程序session
 * @see https://developer.work.weixin.qq.com/document/path/95317
 */
export const TransferMiniProgramSessionRequestSchema = z.object({
  /** 通过code2Session接口获取到的加密的userid */
  userid: z.string().max(64),
  /** 通过code2Session接口获取到的属于上级/上游企业的会话密钥 */
  session_key: z.string().max(64),
});
export type TransferMiniProgramSessionRequest = z.infer<typeof TransferMiniProgramSessionRequestSchema>;
export const TransferMiniProgramSessionResponseSchema = z.object({
  /** 下级/下游企业用户的ID */
  userid: z.string().optional(),
  /** 属于下级/下游企业的会话密钥 */
  session_key: z.string().optional(),
});
export type TransferMiniProgramSessionResponse = z.infer<typeof TransferMiniProgramSessionResponseSchema>;

