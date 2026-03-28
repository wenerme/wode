// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * userid转换
 * @see https://developer.work.weixin.qq.com/document/path/95884
 */
export const BatchOpenUserIdToUserIdRequestSchema = z.object({
  /** open_userid列表，最多不超过1000个。必须是source_agentid对应的应用所获取 */
  open_userid_list: z.array(z.string()),
  /** 企业授权的代开发自建应用或第三方应用的agentid */
  source_agentid: z.number().min(1),
});
export type BatchOpenUserIdToUserIdRequest = z.infer<typeof BatchOpenUserIdToUserIdRequestSchema>;
export const BatchOpenUserIdToUserIdResponseSchema = z.object({
  /** 转换成功的列表 */
  userid_list: z.array(z.object({ open_userid: z.string(), userid: z.string() })).optional(),
  /** 不合法的open_userid列表 */
  invalid_open_userid_list: z.array(z.string()).optional(),
});
export type BatchOpenUserIdToUserIdResponse = z.infer<typeof BatchOpenUserIdToUserIdResponseSchema>;

/**
 * 临时外部用户ID转换
 * @see https://developer.work.weixin.qq.com/document/path/98729
 */
export const ConvertTmpExternalUseridRequestSchema = z.object({
  /** 业务类型。1-会议，2-收集表，3-智能表 (1-会议, 2-收集表, 3-智能表) */
  business_type: z.number(),
  /** 转换的目标用户类型。1-客户，2-企业互联，3-上下游，4-互联企业（圈子） (1-客户, 2-企业互联, 3-上下游, 4-互联企业（圈子）) */
  user_type: z.number(),
  /** 外部用户临时id列表，最多不超过100个 */
  tmp_external_userid_list: z.array(z.string()),
});
export type ConvertTmpExternalUseridRequest = z.infer<typeof ConvertTmpExternalUseridRequestSchema>;
export const ConvertTmpExternalUseridResponseSchema = z.object({
  /** 转换成功的结果列表 */
  results: z.array(z.object({ tmp_external_userid: z.string(), external_userid: z.string(), corpid: z.string(), userid: z.string() })).optional(),
  /** 无法转换的tmp_external_userid。可能非法或没有权限 */
  invalid_tmp_external_userid_list: z.array(z.string()).optional(),
});
export type ConvertTmpExternalUseridResponse = z.infer<typeof ConvertTmpExternalUseridResponseSchema>;

