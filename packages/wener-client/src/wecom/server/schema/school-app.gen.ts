// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取健康上报使用统计
 * @see https://developer.work.weixin.qq.com/document/path/93676
 */
export const GetHealthReportStatRequestSchema = z.object({
  /** 具体某天的使用统计，最长支持获取30天前数据 */
  date: z.string(),
});
export type GetHealthReportStatRequest = z.infer<typeof GetHealthReportStatRequestSchema>;
export const GetHealthReportStatResponseSchema = z.object({
  /** 应用使用次数 */
  pv: z.number().optional(),
  /** 应用使用成员数 */
  uv: z.number().optional(),
});
export type GetHealthReportStatResponse = z.infer<typeof GetHealthReportStatResponseSchema>;

/**
 * 获取用户填写答案
 * @see https://developer.work.weixin.qq.com/document/path/93679
 */
export const GetReportAnswerRequestSchema = z.object({
  /** 任务ID */
  jobid: z.string(),
  /** 具体某天任务的填写答案，仅支持获取最近14天数据 [date] */
  date: z.string().min(10).max(10),
  /** 数据偏移量 */
  offset: z.number().min(0).default(0).optional(),
  /** 拉取的数据量，最大值100 */
  limit: z.number().min(1).max(100).default(100).optional(),
});
export type GetReportAnswerRequest = z.infer<typeof GetReportAnswerRequestSchema>;
export const GetReportAnswerResponseSchema = z.object({
  /** 答案列表 */
  answers: z.array(z.object({ id_type: z.number(), userid: z.string().min(1).max(64), student_userid: z.string().min(1).max(64), parent_userid: z.string().min(1).max(64), report_time: z.number(), report_values: z.array(z.object({ question_id: z.number().min(1), single_choice: z.number().min(1), text: z.string().min(0), multi_choice: z.array(z.number()), fileid: z.array(z.string()), url: z.string().min(0), itinerary_card_type: z.number(), high_risk_area: z.string().min(0) })) })).optional(),
});
export type GetReportAnswerResponse = z.infer<typeof GetReportAnswerResponseSchema>;

/**
 * 获取健康上报任务详情
 * @see https://developer.work.weixin.qq.com/document/path/93678
 */
export const GetHealthReportJobInfoRequestSchema = z.object({
  /** 任务ID */
  jobid: z.string(),
  /** 具体某天任务详情，仅支持获取最近14天数据 [date] */
  date: z.string().min(10).max(10),
});
export type GetHealthReportJobInfoRequest = z.infer<typeof GetHealthReportJobInfoRequestSchema>;
export const GetHealthReportJobInfoResponseSchema = z.object({
  /** 任务详情对象 */
  job_info: z.object({ title: z.string(), creator: z.string(), type: z.number(), apply_range: z.object({ userids: z.array(z.string()), partyids: z.array(z.number()) }), report_to: z.object({ userids: z.array(z.string()) }), report_type: z.number(), skip_weekend: z.number(), finish_cnt: z.number().min(0), question_templates: z.array(z.object({ question_id: z.number(), title: z.string(), question_type: z.number(), is_required: z.number(), option_list: z.array(z.object({ option_id: z.number(), option_text: z.string() })) })) }).optional(),
});
export type GetHealthReportJobInfoResponse = z.infer<typeof GetHealthReportJobInfoResponseSchema>;

/**
 * 获取健康上报任务ID列表
 * @see https://developer.work.weixin.qq.com/document/path/93677
 */
export const GetHealthReportJobIdsRequestSchema = z.object({
  /** 分页，偏移量 */
  offset: z.number().min(0).default(0).optional(),
  /** 分页，预期请求的数据量 */
  limit: z.number().min(1).max(100).default(100).optional(),
});
export type GetHealthReportJobIdsRequest = z.infer<typeof GetHealthReportJobIdsRequestSchema>;
export const GetHealthReportJobIdsResponseSchema = z.object({
  /** 是否结束。0：表示还有更多数据，需要继续拉取，1：表示已经拉取完所有数据 */
  ending: z.number().optional(),
  /** 任务id列表 */
  jobids: z.array(z.string()).optional(),
});
export type GetHealthReportJobIdsResponse = z.infer<typeof GetHealthReportJobIdsResponseSchema>;

/**
 * 删除直播回放
 * @see https://developer.work.weixin.qq.com/document/path/93743
 */
export const DeleteLivingReplayDataRequestSchema = z.object({
  /** 直播ID */
  livingid: z.string(),
});
export type DeleteLivingReplayDataRequest = z.infer<typeof DeleteLivingReplayDataRequestSchema>;

/**
 * 获取老师直播ID列表
 * @see https://developer.work.weixin.qq.com/document/path/93739
 */
export const ListUserLivingIdRequestSchema = z.object({
  /** 企业成员的userid */
  userid: z.string().min(1),
  /** 上一次调用时返回的next_cursor，第一次拉取可以不填 */
  cursor: z.string().min(0).optional(),
  /** 每次拉取的数据量，默认值和最大值都为100 */
  limit: z.number().min(1).max(100).default(100).optional(),
});
export type ListUserLivingIdRequest = z.infer<typeof ListUserLivingIdRequestSchema>;
export const ListUserLivingIdResponseSchema = z.object({
  /** 当前数据最后一个key值，如果下次调用带上该值则从该key值往后拉，用于实现分页拉取，返回空字符串代表已经是最后一页 */
  next_cursor: z.string().optional(),
  /** 直播ID列表 */
  livingid_list: z.array(z.string()).optional(),
});
export type ListUserLivingIdResponse = z.infer<typeof ListUserLivingIdResponseSchema>;

/**
 * 获取学生付款结果
 * @see https://developer.work.weixin.qq.com/document/path/94470
 */
export const GetPaymentResultRequestSchema = z.object({
  /** 收款项目id，由jssdk的发起班级收款接口或者小程序的发起班级收款接口返回 */
  payment_id: z.string().min(1),
});
export type GetPaymentResultRequest = z.infer<typeof GetPaymentResultRequestSchema>;
export const GetPaymentResultResponseSchema = z.object({
  /** 收款项目名称 */
  project_name: z.string().optional(),
  /** 金额 */
  amount: z.number().optional(),
  /** 学生付款信息列表 */
  payment_result: z.array(z.object({ student_userid: z.string(), trade_state: z.number(), trade_no: z.string(), payer_parent_userid: z.string() })).optional(),
});
export type GetPaymentResultResponse = z.infer<typeof GetPaymentResultResponseSchema>;

/**
 * 获取订单详情
 * @see https://developer.work.weixin.qq.com/document/path/94471
 */
export const GetTradeDetailRequestSchema = z.object({
  /** 收款项目id，由发起班级收款接口返回 */
  payment_id: z.string(),
  /** 订单号，由获取学生付款结果返回 */
  trade_no: z.string(),
});
export type GetTradeDetailRequest = z.infer<typeof GetTradeDetailRequestSchema>;
export const GetTradeDetailResponseSchema = z.object({
  /** 微信交易单号 */
  transaction_id: z.string().optional(),
  /** 交易时间 */
  pay_time: z.number().optional(),
});
export type GetTradeDetailResponse = z.infer<typeof GetTradeDetailResponseSchema>;

/**
 * 获取未观看直播统计
 * @see https://developer.work.weixin.qq.com/document/path/93742
 */
export const GetUnwatchLivingStatRequestSchema = z.object({
  /** 直播id */
  livingid: z.string(),
  /** 上一次调用时返回的next_key，初次调用可以填"0" */
  next_key: z.string().default('0').optional(),
});
export type GetUnwatchLivingStatRequest = z.infer<typeof GetUnwatchLivingStatRequestSchema>;
export const GetUnwatchLivingStatResponseSchema = z.object({
  /** 是否结束。0：表示还有更多数据，需要继续拉取，1：表示已经拉取完所有数据 (0-还有更多数据, 1-拉取完所有数据) */
  ending: z.number().optional(),
  /** 当前数据最后一个key值，用于分页拉取 */
  next_key: z.string().optional(),
  /** 统计信息列表 */
  stat_info: z.object({ students: z.array(z.object({ student_userid: z.string(), parent_userid: z.string(), partyids: z.array(z.number()) })) }).optional(),
});
export type GetUnwatchLivingStatResponse = z.infer<typeof GetUnwatchLivingStatResponseSchema>;

/**
 * 获取未观看直播统计V2
 * @see https://developer.work.weixin.qq.com/document/path/95795
 */
export const GetUnwatchStatV2RequestSchema = z.object({
  /** 直播id */
  livingid: z.string(),
  /** 上一次调用时返回的next_cursor，初次调用可以填"0" */
  next_cursor: z.string().default('"0"').optional(),
});
export type GetUnwatchStatV2Request = z.infer<typeof GetUnwatchStatV2RequestSchema>;
export const GetUnwatchStatV2ResponseSchema = z.object({
  /** 是否结束。1：表示还有更多数据，需要继续拉取，0：表示已经拉取完所有数据 (0-已拉取完所有数据, 1-还有更多数据) */
  has_more: z.number().optional(),
  /** 当前数据最后一个cursor值，如果下次调用带上该值则从该cursor值往后拉，用于实现分页拉取 */
  next_cursor: z.string().optional(),
  /** 统计信息列表 */
  stat_info: z.object({ students: z.array(z.object({ student_userid: z.string(), partyids: z.array(z.number()) })), parents: z.array(z.object({ parent_userid: z.string(), student_userid: z.string(), partyids: z.array(z.number()) })) }).optional(),
});
export type GetUnwatchStatV2Response = z.infer<typeof GetUnwatchStatV2ResponseSchema>;

/**
 * 获取观看直播统计V2
 * @see https://developer.work.weixin.qq.com/document/path/95793
 */
export const GetWatchStatV2RequestSchema = z.object({
  /** 直播的id */
  livingid: z.string(),
  /** 上一次调用时返回的next_cursor，初次调用可以填"0" */
  next_cursor: z.string().default('"0"').optional(),
});
export type GetWatchStatV2Request = z.infer<typeof GetWatchStatV2RequestSchema>;
export const GetWatchStatV2ResponseSchema = z.object({
  /** 是否结束。1：表示还有更多数据，需要继续拉取，0：表示已经拉取完所有数据 (0-已拉取完, 1-还有更多数据) */
  has_more: z.number().optional(),
  /** 当前数据最后一个cursor值，用于分页拉取 */
  next_cursor: z.string().optional(),
  /** 统计信息列表 */
  stat_info: z.object({ students: z.array(z.object({ student_userid: z.string(), partyids: z.array(z.number()), watch_time: z.number().min(0), enter_time: z.number(), leave_time: z.number(), is_comment: z.number() })), parents: z.array(z.object({ parent_userid: z.string(), student_userid: z.string(), partyids: z.array(z.number()), watch_time: z.number().min(0), enter_time: z.number(), leave_time: z.number(), is_comment: z.number() })), visitors: z.array(z.object({ nickname: z.string(), watch_time: z.number().min(0), enter_time: z.number(), leave_time: z.number(), is_comment: z.number() })) }).optional(),
});
export type GetWatchStatV2Response = z.infer<typeof GetWatchStatV2ResponseSchema>;

