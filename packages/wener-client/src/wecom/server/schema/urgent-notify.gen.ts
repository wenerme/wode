// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 发起语音电话
 * @see https://developer.work.weixin.qq.com/document/path/91627
 */
export const CallPstnCcRequestSchema = z.object({
  /** 需要呼叫的列表 */
  callee_userid: z.array(z.string()),
});
export type CallPstnCcRequest = z.infer<typeof CallPstnCcRequestSchema>;
export const CallPstnCcResponseSchema = z.object({
  /** 自动语音来电呼叫状态列表 */
  states: z.array(z.object({ code: z.number(), callid: z.string(), userid: z.string() })).optional(),
});
export type CallPstnCcResponse = z.infer<typeof CallPstnCcResponseSchema>;

/**
 * 获取接听状态
 * @see https://developer.work.weixin.qq.com/document/path/91628
 */
export const GetPstnccStateRequestSchema = z.object({
  /** 用户id */
  callee_userid: z.string().min(1),
  /** 发起自动语音来电callid，仅支持查询七天内的callid状态 */
  callid: z.string().min(1),
});
export type GetPstnccStateRequest = z.infer<typeof GetPstnccStateRequestSchema>;
export const GetPstnccStateResponseSchema = z.object({
  /** 是否接听：0.表示未接听，1.表示接听 (0-未接听, 1-已接听) */
  istalked: z.number().optional(),
  /** 呼叫发起时间戳 [timestamp] */
  calltime: z.number().optional(),
  /** 通话时长单位（s） */
  talktime: z.number().optional(),
  /** 呼叫结果状态 (0-正常结束, 1-振铃, 2-接听, 3-通话中, 4-呼叫超时 – 用户挂机, 5-不在服务区, 6-欠费未接...) */
  reason: z.number().optional(),
});
export type GetPstnccStateResponse = z.infer<typeof GetPstnccStateResponseSchema>;

