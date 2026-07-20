// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取审批数据（旧）
 * @see https://developer.work.weixin.qq.com/document/path/91530
 */
export const GetApprovalDataRequestSchema = z.object({
  /** 获取审批记录的开始时间。Unix时间戳 [timestamp] */
  starttime: z.number(),
  /** 获取审批记录的结束时间。Unix时间戳 [timestamp] */
  endtime: z.number(),
  /** 第一个拉取的审批单号，不填从该时间段的第一个审批单拉取 */
  next_spnum: z.number().optional(),
});
export type GetApprovalDataRequest = z.infer<typeof GetApprovalDataRequestSchema>;
export const GetApprovalDataResponseSchema = z.object({
  /** 拉取的审批单个数，最大值为100 */
  count: z.number().max(100).optional(),
  /** 时间段内的总审批单个数 */
  total: z.number().optional(),
  /** 拉取列表的最后一个审批单号 */
  next_spnum: z.number().optional(),
  /** 审批记录列表 */
  data: z.array(z.object({ spname: z.string(), apply_name: z.string(), apply_org: z.string(), approval_name: z.array(z.string()), notify_name: z.array(z.string()), sp_status: z.number(), sp_num: z.number(), mediaids: z.array(z.string()), apply_time: z.number(), apply_user_id: z.string(), expense: z.object({ expense_type: z.number(), reason: z.string(), item: z.array(z.object({ expenseitem_type: z.number(), time: z.number(), sums: z.number(), reason: z.string() })) }), comm: z.object({ apply_data: z.string() }), leave: z.object({ timeunit: z.number(), leave_type: z.number(), start_time: z.number(), end_time: z.number(), duration: z.number(), reason: z.string() }) })).optional(),
});
export type GetApprovalDataResponse = z.infer<typeof GetApprovalDataResponseSchema>;

/**
 * 查询自建应用审批单当前状态
 * @see https://developer.work.weixin.qq.com/document/path/90090
 */
export const GetOpenApprovalDataRequestSchema = z.object({
  /** 开发者发起申请时定义的审批单号，不可重复 */
  thirdNo: z.string().min(1).max(64),
});
export type GetOpenApprovalDataRequest = z.infer<typeof GetOpenApprovalDataRequestSchema>;
export const GetOpenApprovalDataResponseSchema = z.object({
  /** 审批单详情数据 */
  data: z.object({ ThirdNo: z.string().min(1), OpenTemplateId: z.string().min(1), OpenSpName: z.string().min(1), OpenSpstatus: z.number(), ApplyTime: z.number(), ApplyUsername: z.string().min(1).max(64), ApplyUserParty: z.string().min(1).max(64), ApplyUserImage: z.string().min(1), ApplyUserId: z.string().min(1).max(64), ApprovalNodes: z.object({ ApprovalNode: z.array(z.object({ NodeStatus: z.number(), NodeAttr: z.number(), NodeType: z.number(), Items: z.object({ Item: z.array(z.object({ ItemName: z.string().min(1).max(64), ItemUserId: z.string().min(1).max(64), ItemParty: z.string().min(1).max(64), ItemImage: z.string().min(1), ItemStatus: z.number(), ItemSpeech: z.string().min(0), ItemOpTime: z.number() })) }) })) }), NotifyNodes: z.object({ NotifyNode: z.array(z.object({ ItemName: z.string().min(1).max(64), ItemUserId: z.string().min(1).max(64), ItemParty: z.string().min(1).max(64), ItemImage: z.string().min(1) })) }), ApproverStep: z.number().min(0) }).optional(),
});
export type GetOpenApprovalDataResponse = z.infer<typeof GetOpenApprovalDataResponseSchema>;

/**
 * 提交审批申请
 * @see https://developer.work.weixin.qq.com/document/path/91853
 */
export const SubmitApprovalEventRequestSchema = z.object({
  /** 申请人userid，此审批申请将以此员工身份提交，申请人需在应用可见范围内 */
  creator_userid: z.string().min(1),
  /** 模板id。可在“获取审批申请详情”、“审批状态变化回调通知”中获得，也可在审批模板的模板编辑页面链接中获得 */
  template_id: z.string().min(1),
  /** 审批人模式：0-通过接口指定审批人、抄送人（此时process参数必填）; 1-使用此模板在管理后台设置的审批流程(需要保证审批流程中没有“申请人自选”节点)， (0-通过接口指定审批人、抄送人, 1-使用此模板在管理后台设置的审批流程) */
  use_template_approver: z.number(),
  /** 提单者提单部门id，不填默认为主部门 */
  choose_department: z.number().optional(),
  /** 审批申请数据，可定义审批申请中各个控件的值 */
  apply_data: z.object({ contents: z.array(z.object({ control: z.string(), id: z.string().min(1), value: z.record(z.string(), z.any()) })) }),
  /** 摘要信息，用于显示在审批通知卡片、审批列表的摘要信息，最多3行 */
  summary_list: z.array(z.object({ summary_info: z.array(z.object({ text: z.string().min(1).max(20), lang: z.string() })) })),
  /** 新版流程列表，use_template_approver = 0时必填 */
  process: z.object({ node_list: z.array(z.object({ type: z.number(), apv_rel: z.number(), userid: z.array(z.string()) })) }).optional(),
});
export type SubmitApprovalEventRequest = z.infer<typeof SubmitApprovalEventRequestSchema>;
export const SubmitApprovalEventResponseSchema = z.object({
  /** 表单提交成功后，返回的表单编号 */
  sp_no: z.string().optional(),
});
export type SubmitApprovalEventResponse = z.infer<typeof SubmitApprovalEventResponseSchema>;

/**
 * 创建审批模板
 * @see https://developer.work.weixin.qq.com/document/path/97437
 */
export const CreateApprovalTemplateRequestSchema = z.object({
  /** 模版名称数组 */
  template_name: z.array(z.object({ text: z.string().max(40), lang: z.string() })),
  /** 审批模版控件设置，由多个表单控件及其内容组成 */
  template_content: z.object({ controls: z.array(z.object({ property: z.object({ control: z.string(), id: z.string(), title: z.array(z.object({ text: z.string().max(40), lang: z.string() })), placeholder: z.array(z.object({ text: z.string().max(80), lang: z.string() })), require: z.number(), un_print: z.number() }), config: z.record(z.string(), z.any()) })) }),
});
export type CreateApprovalTemplateRequest = z.infer<typeof CreateApprovalTemplateRequestSchema>;
export const CreateApprovalTemplateResponseSchema = z.object({
  /** 模版创建成功后返回的模版id */
  template_id: z.string().optional(),
});
export type CreateApprovalTemplateResponse = z.infer<typeof CreateApprovalTemplateResponseSchema>;

/**
 * 更新审批模板
 * @see https://developer.work.weixin.qq.com/document/path/97438
 */
export const UpdateApprovalTemplateRequestSchema = z.object({
  /** 模版id */
  template_id: z.string(),
  /** 模版名称数组 */
  template_name: z.array(z.object({ text: z.string().min(1).max(40), lang: z.string() })),
  /** 审批模版控件设置 */
  template_content: z.object({ controls: z.array(z.object({ property: z.object({ control: z.string(), id: z.string(), title: z.array(z.object({ text: z.string().min(1).max(40), lang: z.string() })), placeholder: z.array(z.object({ text: z.string().min(1).max(40), lang: z.string() })), require: z.number(), un_print: z.number() }), config: z.object({ selector: z.object({ type: z.string(), options: z.array(z.object({ key: z.string().min(1), value: z.object({ text: z.string().min(1).max(40), lang: z.string() }) })) }) }) })) }),
});
export type UpdateApprovalTemplateRequest = z.infer<typeof UpdateApprovalTemplateRequestSchema>;

/**
 * 获取审批申请详情
 * @see https://developer.work.weixin.qq.com/document/path/91983
 */
export const GetApprovalDetailRequestSchema = z.object({
  /** 审批单编号 */
  sp_no: z.string().min(1),
});
export type GetApprovalDetailRequest = z.infer<typeof GetApprovalDetailRequestSchema>;
export const GetApprovalDetailResponseSchema = z.object({
  /** 审批申请详情信息 */
  info: z.object({ sp_no: z.string(), sp_name: z.string(), sp_status: z.number(), template_id: z.string(), apply_time: z.number(), applyer: z.object({ userid: z.string(), partyid: z.string() }), batch_applyer: z.object({ userid: z.string() }), sp_record: z.array(z.object({ sp_status: z.number(), approverattr: z.number(), details: z.array(z.object({ approver: z.object({ userid: z.string() }), speech: z.string(), sp_status: z.number(), sptime: z.number(), media_id: z.array(z.string()) })) })), notifyer: z.array(z.object({ userid: z.string() })), apply_data: z.object({ contents: z.array(z.object({ control: z.string(), id: z.string(), title: z.array(z.object({ text: z.string(), lang: z.string() })), value: z.object({ text: z.string(), new_number: z.string(), new_money: z.string(), selector: z.object({ type: z.string(), options: z.array(z.object({ key: z.string(), value: z.array(z.object({ text: z.string(), lang: z.string() })) })) }), members: z.array(z.object({ userid: z.string(), name: z.string() })), departments: z.array(z.object({ openapi_id: z.string(), name: z.string() })), new_tips: z.object({ tips_content: z.array(z.record(z.string(), z.any())) }), files: z.array(z.object({ file_id: z.string() })), children: z.array(z.object({ list: z.array(z.record(z.string(), z.any())) })), vacation: z.record(z.string(), z.any()), stat_field: z.array(z.record(z.string(), z.any())) }), hidden: z.number() })) }), comments: z.array(z.object({ commentUserInfo: z.object({ userid: z.string() }), commenttime: z.number(), commentcontent: z.string(), commentid: z.string(), media_id: z.array(z.string()) })), process_list: z.object({ node_list: z.array(z.object({ node_type: z.number(), sp_status: z.number(), apv_rel: z.number(), sub_node_list: z.array(z.object({ userid: z.string(), speech: z.string(), sp_yj: z.number(), sptime: z.number(), media_ids: z.array(z.string()) })) })) }) }).optional(),
});
export type GetApprovalDetailResponse = z.infer<typeof GetApprovalDetailResponseSchema>;

/**
 * 获取审批模板详情
 * @see https://developer.work.weixin.qq.com/document/path/91982
 */
export const GetApprovalTemplateDetailRequestSchema = z.object({
  /** 模板的唯一标识id。可在获取审批单据详情、审批状态变化回调通知中获得，也可在审批模板的模板编辑页面浏览器Url链接中获得。 */
  template_id: z.string().min(1),
});
export type GetApprovalTemplateDetailRequest = z.infer<typeof GetApprovalTemplateDetailRequestSchema>;
export const GetApprovalTemplateDetailResponseSchema = z.object({
  /** 模板名称数组，若配置了多语言则会包含中英文的模板名称，默认为zh_CN中文 */
  template_names: z.array(z.object({ text: z.string(), lang: z.string() })).optional(),
  /** 模板控件信息 */
  template_content: z.object({ controls: z.array(z.object({ property: z.object({ control: z.string(), id: z.string(), title: z.array(z.object({ text: z.string(), lang: z.string() })), placeholder: z.array(z.object({ text: z.string(), lang: z.string() })), require: z.number(), un_print: z.number() }), config: z.record(z.string(), z.any()) })) }).optional(),
});
export type GetApprovalTemplateDetailResponse = z.infer<typeof GetApprovalTemplateDetailResponseSchema>;

export const GetCorpVacationConfigResponseSchema = z.object({
  /** 假期列表 */
  lists: z.array(z.object({ id: z.number(), name: z.string(), time_attr: z.number(), duration_type: z.number(), quota_attr: z.object({ type: z.number(), autoreset_time: z.number(), autoreset_duration: z.number(), quota_rule_type: z.number(), quota_rules: z.object({ list: z.array(z.object({ quota: z.number(), begin: z.number(), end: z.number(), based_on_actual_work_time: z.boolean() })), based_on_actual_work_time: z.boolean() }), at_entry_date: z.boolean(), auto_reset_month_day: z.number() }), perday_duration: z.number(), is_newovertime: z.number(), enter_comp_time_limit: z.number(), expire_rule: z.object({ type: z.number(), duration: z.number(), date: z.object({ month: z.number(), day: z.number() }), extern_duration_enable: z.boolean(), extern_duration: z.object({ month: z.number(), day: z.number() }) }) })).optional(),
});
export type GetCorpVacationConfigResponse = z.infer<typeof GetCorpVacationConfigResponseSchema>;

/**
 * 获取成员假期余额
 * @see https://developer.work.weixin.qq.com/document/path/93376
 */
export const GetUserVacationQuotaRequestSchema = z.object({
  /** 需要获取假期余额的成员的userid */
  userid: z.string(),
});
export type GetUserVacationQuotaRequest = z.infer<typeof GetUserVacationQuotaRequestSchema>;
export const GetUserVacationQuotaResponseSchema = z.object({
  /** 假期列表 */
  lists: z.array(z.object({ id: z.number(), assignduration: z.number(), usedduration: z.number(), leftduration: z.number(), vacationname: z.string(), real_assignduration: z.number() })).optional(),
});
export type GetUserVacationQuotaResponse = z.infer<typeof GetUserVacationQuotaResponseSchema>;

/**
 * 修改成员假期余额
 * @see https://developer.work.weixin.qq.com/document/path/93389
 */
export const SetUserQuotaRequestSchema = z.object({
  /** 需要修改假期余额的成员的userid */
  userid: z.string().min(1).max(64),
  /** 假期id */
  vacation_id: z.number().min(1),
  /** 设置的假期余额，单位为秒。不能大于1000天或24000小时。当假期时间刻度为按小时请假时，必须为360整倍数；按天请假时，必须为8640整倍数 */
  leftduration: z.number().min(0),
  /** 假期时间刻度：0-按天请假；1-按小时请假。主要用于校验，必须等于企业假期管理配置中设置的假期时间刻度类型 (0-按天请假, 1-按小时请假) */
  time_attr: z.number(),
  /** 修改备注，用于显示在假期余额的修改记录当中，可对修改行为作说明，不超过200字符 */
  remarks: z.string().min(1).max(200).optional(),
});
export type SetUserQuotaRequest = z.infer<typeof SetUserQuotaRequestSchema>;

