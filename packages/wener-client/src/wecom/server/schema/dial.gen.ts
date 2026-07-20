// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取公费电话拨打记录
 * @see https://developer.work.weixin.qq.com/document/path/93662
 */
export const GetDialRecordRequestSchema = z.object({
  /** 查询的起始时间戳，Unix时间戳 [timestamp] */
  start_time: z.number().optional(),
  /** 查询的结束时间戳，Unix时间戳 [timestamp] */
  end_time: z.number().optional(),
  /** 分页查询的偏移量 */
  offset: z.number().min(0).default(0).optional(),
  /** 分页查询的每页大小，默认为100条，如该参数大于100则按100处理 */
  limit: z.number().min(1).max(100).default(100).optional(),
});
export type GetDialRecordRequest = z.infer<typeof GetDialRecordRequestSchema>;
export const GetDialRecordResponseSchema = z.object({
  /** 拨打记录列表 */
  record: z.array(z.object({ call_time: z.number(), total_duration: z.number(), call_type: z.number(), caller: z.object({ userid: z.string(), duration: z.number() }), callee: z.array(z.object({ userid: z.string(), phone: z.string(), duration: z.number() })) })).optional(),
});
export type GetDialRecordResponse = z.infer<typeof GetDialRecordResponseSchema>;

