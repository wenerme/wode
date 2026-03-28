// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 批量获取申请单ID
 * @see https://developer.work.weixin.qq.com/document/path/99883
 */
export const ListApplyIdRequestSchema = z.object({
  /** 申请的高级账号类型。1-邮件 2-文档 3-微盘 4-会议 (1-邮件, 2-文档, 3-微盘, 4-会议) */
  business_type: z.number(),
  /** 申请的userid */
  userid: z.string().min(1).max(64),
  /** 分页查询的数据上限。默认100，最大200。注意：不保证每次返回的数据刚好为指定limit，须用返回的has_more判断是否继续请求 */
  limit: z.number().max(200).default(100).optional(),
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().min(0).optional(),
  /** 0-所有 1-仅api单 2-非api 申请单，默认为0 (0-所有, 1-仅api单, 2-非api申请单) */
  req_type: z.number().optional(),
});
export type ListApplyIdRequest = z.infer<typeof ListApplyIdRequestSchema>;
export const ListApplyIdResponseSchema = z.object({
  /** 分页请求的下一页游标 */
  next_cursor: z.string().optional(),
  /** 申请id列表 */
  apply_id_list: z.array(z.string()).optional(),
  /** 是否还有下一页数据 */
  has_more: z.boolean().optional(),
});
export type ListApplyIdResponse = z.infer<typeof ListApplyIdResponseSchema>;

/**
 * 获取申请单详细信息
 * @see https://developer.work.weixin.qq.com/document/path/99885
 */
export const GetApprovalInfoRequestSchema = z.object({
  /** 申请id */
  apply_id: z.string().min(1),
});
export type GetApprovalInfoRequest = z.infer<typeof GetApprovalInfoRequestSchema>;
export const GetApprovalInfoResponseSchema = z.object({
  /** 申请单详细信息 */
  approval_info: z.object({ applicant: z.string(), create_time: z.number(), business_type: z.number(), apply_id: z.string(), approval_id: z.string(), approval_url: z.string(), approval_status: z.number(), approval_type: z.number(), request_reason: z.string() }).optional(),
});
export type GetApprovalInfoResponse = z.infer<typeof GetApprovalInfoResponseSchema>;

/**
 * 设置审批单审批信息
 * @see https://developer.work.weixin.qq.com/document/path/99880
 */
export const SetApprovalDetailRequestSchema = z.object({
  /** 审批id，注意：应用生成审批id后，审批id和申请id是一一对应的，不可改变 */
  approval_id: z.string().min(1),
  /** 审批单状态 (1-审批中, 2-已驳回, 3-已同意, 101-已撤销) */
  approval_status: z.number(),
  /** 申请id */
  apply_id: z.string().min(1),
  /** 审批单跳转链接，须已"http://"或"https://"开头 */
  approval_url: z.string().min(1),
  /** 审批单审批节点，注意：如果需要变更审批节点信息，需要全量节点都传入 */
  process_list: z.object({ node_list: z.array(z.object({ current_approvers: z.array(z.string()), completed_approvers: z.array(z.string()), node_apv_status: z.number(), node_apv_rel: z.number(), apv_update_time: z.number() })) }),
});
export type SetApprovalDetailRequest = z.infer<typeof SetApprovalDetailRequestSchema>;

