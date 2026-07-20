// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取会话内容存档开启成员列表
 * @see https://developer.work.weixin.qq.com/document/path/91614
 */
export const MessageAuditGetPermitUserListRequestSchema = z.object({
  /** 拉取对应版本的开启成员列表。1表示办公版；2表示服务版；3表示企业版。非必填，不填写的时候返回全量成员列表 (1-办公版, 2-服务版, 3-企业版) */
  type: z.number().optional(),
});
export type MessageAuditGetPermitUserListRequest = z.infer<typeof MessageAuditGetPermitUserListRequestSchema>;
export const MessageAuditGetPermitUserListResponseSchema = z.object({
  /** 设置在开启范围内的成员的userid列表，部门、标签范围会打散为成员userid */
  ids: z.array(z.string()).optional(),
});
export type MessageAuditGetPermitUserListResponse = z.infer<typeof MessageAuditGetPermitUserListResponseSchema>;

/**
 * 获取会话内容存档内部群信息
 * @see https://developer.work.weixin.qq.com/document/path/92951
 */
export const MessageAuditGetGroupChatRequestSchema = z.object({
  /** 待查询的群id */
  roomid: z.string().min(1),
});
export type MessageAuditGetGroupChatRequest = z.infer<typeof MessageAuditGetGroupChatRequestSchema>;
export const MessageAuditGetGroupChatResponseSchema = z.object({
  /** 群名称 */
  roomname: z.string().optional(),
  /** 群创建者userid */
  creator: z.string().optional(),
  /** 群创建时间，Unix时间戳 */
  room_create_time: z.number().optional(),
  /** 群公告 */
  notice: z.string().optional(),
  /** 群成员列表 */
  members: z.array(z.object({ memberid: z.string(), jointime: z.number() })).optional(),
});
export type MessageAuditGetGroupChatResponse = z.infer<typeof MessageAuditGetGroupChatResponseSchema>;

