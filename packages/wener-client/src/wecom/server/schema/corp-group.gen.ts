// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

export const GetChainListResponseSchema = z.object({
  /** 企业上下游列表 */
  chains: z.array(z.record(z.string(), z.any())).optional(),
});
export type GetChainListResponse = z.infer<typeof GetChainListResponseSchema>;

/**
 * 查询成员自定义id
 * @see https://developer.work.weixin.qq.com/document/path/97441
 */
export const GetChainUserCustomIdRequestSchema = z.object({
  /** 上下游id */
  chain_id: z.string(),
  /** 已加入企业id */
  corpid: z.string(),
  /** 企业内的成员 */
  userid: z.string(),
});
export type GetChainUserCustomIdRequest = z.infer<typeof GetChainUserCustomIdRequestSchema>;
export const GetChainUserCustomIdResponseSchema = z.object({
  /** 成员自定义 id */
  user_custom_id: z.string().optional(),
});
export type GetChainUserCustomIdResponse = z.infer<typeof GetChainUserCustomIdResponseSchema>;

/**
 * 获取应用共享信息
 * @see https://developer.work.weixin.qq.com/document/path/95813
 */
export const ListCorpGroupAppShareRequestSchema = z.object({
  /** 上级/上游企业应用agentid */
  agentid: z.number(),
  /** 业务类型，填0则为企业互联/局校互联，填1则表示上下游企业 (0-企业互联/局校互联, 1-上下游企业) */
  business_type: z.number().optional(),
  /** 下级/下游企业corpid，若指定该参数则表示拉取该下级/下游企业的应用共享信息 */
  corpid: z.string().min(1).optional(),
  /** 返回的最大记录数，最大值100，默认情况或者值为0表示下拉取全量数据 */
  limit: z.number().min(0).max(100).default(0).optional(),
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().min(0).optional(),
});
export type ListCorpGroupAppShareRequest = z.infer<typeof ListCorpGroupAppShareRequestSchema>;
export const ListCorpGroupAppShareResponseSchema = z.object({
  /** 1表示拉取完毕，0表示数据没有拉取完 */
  ending: z.number().optional(),
  /** 分页游标，再下次请求时填写以获取之后分页的记录，如果已经没有更多的数据则返回空 */
  next_cursor: z.string().optional(),
  /** 应用共享信息列表 */
  corp_list: z.array(z.object({ corpid: z.string(), corp_name: z.string(), agentid: z.number() })).optional(),
});
export type ListCorpGroupAppShareResponse = z.infer<typeof ListCorpGroupAppShareResponseSchema>;

/**
 * 移除企业
 * @see https://developer.work.weixin.qq.com/document/path/95822
 */
export const RemoveCorpFromGroupRequestSchema = z.object({
  /** 上下游id */
  chain_id: z.string(),
  /** 需要移除的下游企业corpid，与pending_corpid至少填一个 */
  corpid: z.string().optional(),
  /** 需要移除的未加入下游企业corpid，与corpid至少填一个 */
  pending_corpid: z.string().optional(),
});
export type RemoveCorpFromGroupRequest = z.infer<typeof RemoveCorpFromGroupRequestSchema>;

/**
 * 获取下级企业加入的上下游
 * @see https://developer.work.weixin.qq.com/document/path/97442
 */
export const GetCorpSharedChainListRequestSchema = z.object({
  /** 已加入企业id */
  corpid: z.string().optional(),
});
export type GetCorpSharedChainListRequest = z.infer<typeof GetCorpSharedChainListRequestSchema>;
export const GetCorpSharedChainListResponseSchema = z.object({
  /** 上下游列表 */
  chains: z.array(z.object({ chain_id: z.string(), chain_name: z.string() })).optional(),
});
export type GetCorpSharedChainListResponse = z.infer<typeof GetCorpSharedChainListResponseSchema>;

/**
 * 获取异步任务结果
 * @see https://developer.work.weixin.qq.com/document/path/95823
 */
export const GetAsyncJobResultRequestSchema = z.object({
  /** 异步任务id */
  jobid: z.string().min(1).max(64),
});
export type GetAsyncJobResultRequest = z.infer<typeof GetAsyncJobResultRequestSchema>;
export const GetAsyncJobResultResponseSchema = z.object({
  /** 任务状态，整型，1表示任务开始，2表示任务进行中，3表示任务已完成 (1-任务开始, 2-任务进行中, 3-任务已完成) */
  status: z.number().optional(),
  /** 详细的处理结果。当任务完成后此字段有效 */
  result: z.object({ chain_id: z.string(), import_status: z.number(), fail_list: z.array(z.object({ corp_name: z.string(), custom_id: z.string(), errcode: z.number(), errmsg: z.string(), contact_info_list: z.array(z.object({ mobile: z.string(), errcode: z.number(), errmsg: z.string() })) })) }).optional(),
});
export type GetAsyncJobResultResponse = z.infer<typeof GetAsyncJobResultResponseSchema>;

/**
 * 批量导入上下游联系人
 * @see https://developer.work.weixin.qq.com/document/path/95821
 */
export const ImportChainContactRequestSchema = z.object({
  /** 上下游id。文件中的联系人将会被导入此上下游中 */
  chain_id: z.string(),
  /** 上下游联系人列表。这些联系人将会被导入此上下游中 */
  contact_list: z.array(z.object({ corp_name: z.string().min(1).max(32), group_path: z.string(), custom_id: z.string().min(0).max(64), contact_info_list: z.array(z.object({ name: z.string().min(1).max(32), identity_type: z.number(), mobile: z.string(), user_custom_id: z.string().max(64) })) })),
});
export type ImportChainContactRequest = z.infer<typeof ImportChainContactRequestSchema>;
export const ImportChainContactResponseSchema = z.object({
  /** 异步任务 id，最大长度为64字节 */
  jobid: z.string().optional(),
});
export type ImportChainContactResponse = z.infer<typeof ImportChainContactResponseSchema>;

/**
 * 新增对接规则
 * @see https://developer.work.weixin.qq.com/document/path/95664
 */
export const AddCorpGroupRuleRequestSchema = z.object({
  /** 上下游id */
  chain_id: z.string(),
  /** 上下游关系规则的详情 */
  rule_info: z.object({ owner_corp_range: z.object({ departmentids: z.array(z.string()), userids: z.array(z.string()) }), member_corp_range: z.object({ groupids: z.array(z.string()), corpids: z.array(z.string()) }) }),
});
export type AddCorpGroupRuleRequest = z.infer<typeof AddCorpGroupRuleRequestSchema>;
export const AddCorpGroupRuleResponseSchema = z.object({
  /** 上下游规则id */
  rule_id: z.number().optional(),
});
export type AddCorpGroupRuleResponse = z.infer<typeof AddCorpGroupRuleResponseSchema>;

/**
 * 删除对接规则
 * @see https://developer.work.weixin.qq.com/document/path/95663
 */
export const DeleteCorpGroupRuleRequestSchema = z.object({
  /** 上下游id */
  chain_id: z.string(),
  /** 上下游规则id */
  rule_id: z.number(),
});
export type DeleteCorpGroupRuleRequest = z.infer<typeof DeleteCorpGroupRuleRequestSchema>;

/**
 * 获取对接规则详情
 * @see https://developer.work.weixin.qq.com/document/path/95667
 */
export const GetRuleInfoRequestSchema = z.object({
  /** 上下游id */
  chain_id: z.string().min(1),
  /** 上下游规则id */
  rule_id: z.number().min(1),
});
export type GetRuleInfoRequest = z.infer<typeof GetRuleInfoRequestSchema>;
export const GetRuleInfoResponseSchema = z.object({
  /** 上下游关系规则的详情 */
  rule_info: z.object({ owner_corp_range: z.object({ departmentids: z.array(z.string()), userids: z.array(z.string()) }), member_corp_range: z.object({ groupids: z.array(z.string()), corpids: z.array(z.string()) }) }).optional(),
});
export type GetRuleInfoResponse = z.infer<typeof GetRuleInfoResponseSchema>;

/**
 * 获取对接规则id列表
 * @see https://developer.work.weixin.qq.com/document/path/95631
 */
export const ListRuleIdRequestSchema = z.object({
  /** 上下游id */
  chain_id: z.string(),
});
export type ListRuleIdRequest = z.infer<typeof ListRuleIdRequestSchema>;
export const ListRuleIdResponseSchema = z.object({
  /** 上下游关系规则的id */
  rule_ids: z.array(z.number()).optional(),
});
export type ListRuleIdResponse = z.infer<typeof ListRuleIdResponseSchema>;

/**
 * 更新对接规则
 * @see https://developer.work.weixin.qq.com/document/path/95666
 */
export const ModifyRuleRequestSchema = z.object({
  /** 上下游id */
  chain_id: z.string(),
  /** 上下游规则id */
  rule_id: z.number().min(1),
  /** 上下游关系规则的详情 */
  rule_info: z.object({ owner_corp_range: z.object({ departmentids: z.array(z.string()), userids: z.array(z.string()) }), member_corp_range: z.object({ groupids: z.array(z.string()), corpids: z.array(z.string()) }) }),
});
export type ModifyRuleRequest = z.infer<typeof ModifyRuleRequestSchema>;

/**
 * 上下游关联客户信息-已添加客户
 * @see https://developer.work.weixin.qq.com/document/path/95818
 */
export const LinkUnionidToExternalUseridRequestSchema = z.object({
  /** 微信客户的unionid */
  unionid: z.string(),
  /** 微信客户的openid */
  openid: z.string(),
  /** 需要换取的企业corpid，不填则拉取所有企业 */
  corpid: z.string().optional(),
  /** 大批量调用凭据，适用于数据初始化场景 */
  mass_call_ticket: z.string().optional(),
});
export type LinkUnionidToExternalUseridRequest = z.infer<typeof LinkUnionidToExternalUseridRequestSchema>;
export const LinkUnionidToExternalUseridResponseSchema = z.object({
  /** 该unionid对应的外部联系人信息 */
  external_userid_info: z.array(z.object({ corpid: z.string(), external_userid: z.string() })).optional(),
});
export type LinkUnionidToExternalUseridResponse = z.infer<typeof LinkUnionidToExternalUseridResponseSchema>;

/**
 * unionid查询pending_id
 * @see https://developer.work.weixin.qq.com/document/path/98039
 */
export const UnionidToPendingIdRequestSchema = z.object({
  /** 微信客户的unionid */
  unionid: z.string(),
  /** 微信客户的openid */
  openid: z.string(),
});
export type UnionidToPendingIdRequest = z.infer<typeof UnionidToPendingIdRequestSchema>;
export const UnionidToPendingIdResponseSchema = z.object({
  /** unionid和openid对应的pending_id */
  pending_id: z.string().optional(),
});
export type UnionidToPendingIdResponse = z.infer<typeof UnionidToPendingIdResponseSchema>;

