// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 取消预约直播
 * @see https://developer.work.weixin.qq.com/document/path/93789
 */
export const CancelLivingRequestSchema = z.object({
  /** 直播id，仅允许取消预约状态下的直播id */
  livingid: z.string().min(1),
});
export type CancelLivingRequest = z.infer<typeof CancelLivingRequestSchema>;

/**
 * 创建预约直播
 * @see https://developer.work.weixin.qq.com/document/path/93788
 */
export const CreateLivingRequestSchema = z.object({
  /** 直播发起者的userid */
  anchor_userid: z.string(),
  /** 直播的标题，最多支持20个utf8字符 */
  theme: z.string().max(20),
  /** 直播开始时间的unix时间戳 [timestamp] */
  living_start: z.number(),
  /** 直播持续时长（秒） */
  living_duration: z.number(),
  /** 直播的简介，最多支持100个utf8字符，仅对通用直播、小班课、大班课和企业培训生效 */
  description: z.string().max(100).optional(),
  /** 直播的类型，0：通用直播，1：小班课，2：大班课，3：企业培训，4：活动直播，默认 0 (0-通用直播, 1-小班课, 2-大班课, 3-企业培训, 4-活动直播) */
  type: z.number().optional(),
  /** 授权方安装的应用agentid。仅旧的第三方多应用套件需要填此参数 */
  agentid: z.number().optional(),
  /** 指定直播开始前多久提醒用户，相对于living_start前的秒数，默认为0 */
  remind_time: z.number().default(0).optional(),
  /** 活动直播特定参数，直播间封面图的mediaId */
  activity_cover_mediaid: z.string().optional(),
  /** 活动直播特定参数，直播分享卡片图的mediaId */
  activity_share_mediaid: z.string().optional(),
  /** 活动直播特定参数，活动直播详情信息 */
  activity_detail: z.object({ description: z.string(), image_list: z.array(z.string()) }).optional(),
});
export type CreateLivingRequest = z.infer<typeof CreateLivingRequestSchema>;
export const CreateLivingResponseSchema = z.object({
  /** 直播id，通过此id可调用进入直播接口 */
  livingid: z.string().optional(),
});
export type CreateLivingResponse = z.infer<typeof CreateLivingResponseSchema>;

/**
 * 获取微信观看直播凭证
 * @see https://developer.work.weixin.qq.com/document/path/93838
 */
export const GetLivingCodeRequestSchema = z.object({
  /** 直播id */
  livingid: z.string().min(1),
  /** 微信用户的openid */
  openid: z.string().min(1),
});
export type GetLivingCodeRequest = z.infer<typeof GetLivingCodeRequestSchema>;
export const GetLivingCodeResponseSchema = z.object({
  /** 微信观看直播凭证，5分钟内可以重复使用，且仅能在微信上使用。开发者获取到该凭证后可以在微信H5页面或小程序进入直播或直播回放页 */
  living_code: z.string().optional(),
});
export type GetLivingCodeResponse = z.infer<typeof GetLivingCodeResponseSchema>;

/**
 * 获取直播详情
 * @see https://developer.work.weixin.qq.com/document/path/93635
 */
export const GetLivingInfoRequestSchema = z.object({
  /** 直播ID */
  livingid: z.string(),
});
export type GetLivingInfoRequest = z.infer<typeof GetLivingInfoRequestSchema>;
export const GetLivingInfoResponseSchema = z.object({
  /** 直播信息 */
  living_info: z.object({ theme: z.string(), living_start: z.number(), living_duration: z.number(), status: z.number(), reserve_start: z.number(), reserve_living_duration: z.number(), description: z.string().max(300), anchor_userid: z.string().min(1).max(64), main_department: z.number().min(1), viewer_num: z.number().min(0), comment_num: z.number().min(0), mic_num: z.number().min(0), open_replay: z.number(), replay_status: z.number(), type: z.number(), push_stream_url: z.string(), online_count: z.number().min(0), subscribe_count: z.number().min(0) }).optional(),
});
export type GetLivingInfoResponse = z.infer<typeof GetLivingInfoResponseSchema>;

/**
 * 获取跳转小程序商城的直播观众信息
 * @see https://developer.work.weixin.qq.com/document/path/94487
 */
export const GetLivingShareInfoRequestSchema = z.object({
  /** “推广产品”直播观众跳转小程序商城时会在小程序path中带上ww_share_code=xxxxx参数，ww_share_code五分钟内有效 */
  ww_share_code: z.string().min(1),
});
export type GetLivingShareInfoRequest = z.infer<typeof GetLivingShareInfoRequestSchema>;
export const GetLivingShareInfoResponseSchema = z.object({
  /** 直播id */
  livingid: z.string().optional(),
  /** 观众的userid，观众为企业内部成员时返回 */
  viewer_userid: z.string().optional(),
  /** 观众的external_userid，观众为非企业内部成员时返回 */
  viewer_external_userid: z.string().optional(),
  /** 邀请人的userid，邀请人为企业内部成员时返回（观众首次进入直播时，其使用的直播卡片/二维码所对应的分享人） */
  invitor_userid: z.string().optional(),
  /** 邀请人的external_userid，邀请人为非企业内部成员时返回（观众首次进入直播时，其使用的直播卡片/二维码所对应的分享人） */
  invitor_external_userid: z.string().optional(),
});
export type GetLivingShareInfoResponse = z.infer<typeof GetLivingShareInfoResponseSchema>;

/**
 * 获取直播观看明细
 * @see https://developer.work.weixin.qq.com/document/path/93787
 */
export const GetLivingWatchStatRequestSchema = z.object({
  /** 直播的id */
  livingid: z.string(),
  /** 上一次调用时返回的next_key，初次调用可以填"0" */
  next_key: z.string().default('"0"').optional(),
});
export type GetLivingWatchStatRequest = z.infer<typeof GetLivingWatchStatRequestSchema>;
export const GetLivingWatchStatResponseSchema = z.object({
  /** 是否结束。0：表示还有更多数据，需要继续拉取，1：表示已经拉取完所有数据 (0-还有更多数据, 1-已拉取完所有数据) */
  ending: z.number().optional(),
  /** 当前数据最后一个key值，用于分页拉取 */
  next_key: z.string().optional(),
  /** 统计信息列表 */
  stat_info: z.object({ users: z.array(z.object({ userid: z.string(), watch_time: z.number(), is_comment: z.number(), is_mic: z.number(), invitor_userid: z.string(), invitor_external_userid: z.string() })), external_users: z.array(z.object({ external_userid: z.string(), type: z.number(), name: z.string(), watch_time: z.number(), is_comment: z.number(), is_mic: z.number(), invitor_userid: z.string(), invitor_external_userid: z.string() })) }).optional(),
});
export type GetLivingWatchStatResponse = z.infer<typeof GetLivingWatchStatResponseSchema>;

/**
 * 修改预约直播
 * @see https://developer.work.weixin.qq.com/document/path/93790
 */
export const ModifyLivingRequestSchema = z.object({
  /** 直播id，仅允许修改预约状态下的直播id */
  livingid: z.string().min(1),
  /** 直播的标题，最多支持60个字节 */
  theme: z.string().min(1).max(60).optional(),
  /** 直播开始时间的unix时间戳 [timestamp] */
  living_start: z.number().min(0).optional(),
  /** 直播持续时长 */
  living_duration: z.number().min(0).optional(),
  /** 直播的类型，0：通用直播，1：小班课，2：大班课，3：企业培训，4：活动直播 (0-通用直播, 1-小班课, 2-大班课, 3-企业培训, 4-活动直播) */
  type: z.number().optional(),
  /** 直播的简介，最多支持300个字节 */
  description: z.string().min(1).max(300).optional(),
  /** 指定直播开始前多久提醒用户，相对于living_start前的秒数 */
  remind_time: z.number().min(0).default(0).optional(),
});
export type ModifyLivingRequest = z.infer<typeof ModifyLivingRequestSchema>;

