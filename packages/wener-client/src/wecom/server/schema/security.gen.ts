// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取管理端操作日志
 * @see https://developer.work.weixin.qq.com/document/path/100179
 */
export const ListAdminOperLogRequestSchema = z.object({
  /** 开始时间，Unix时间戳。取值范围：不早于180天前 [timestamp] */
  start_time: z.number(),
  /** 结束时间，Unix时间戳。需大于start_time且小于当前时间，跨度不超过7天 [timestamp] */
  end_time: z.number(),
  /** 操作类型。不填表示全部 (2-权限管理变更, 3-成员与部门变更, 7-其它, 8-应用变更, 11-通讯录与聊天管理, 12-企业信息管理...) */
  oper_type: z.number().optional(),
  /** 操作者userid */
  userid: z.string().min(1).max(64).optional(),
  /** 分页游标。不填表示首页 */
  cursor: z.string().min(0).optional(),
  /** 最大记录数。默认最多400 */
  limit: z.number().min(1).max(400).default(400).optional(),
});
export type ListAdminOperLogRequest = z.infer<typeof ListAdminOperLogRequestSchema>;
export const ListAdminOperLogResponseSchema = z.object({
  /** 是否还有下一页 */
  has_more: z.boolean().optional(),
  /** 下一页的分页游标 */
  next_cursor: z.string().optional(),
  /** 记录列表 */
  record_list: z.array(z.object({ time: z.number(), userid: z.string(), oper_type: z.number(), detail_type: z.number(), detail_info: z.string(), ip: z.string() })).optional(),
});
export type ListAdminOperLogResponse = z.infer<typeof ListAdminOperLogResponseSchema>;

/**
 * 文件防泄漏
 * @see https://developer.work.weixin.qq.com/document/path/98883
 */
export const GetFileOperRecordRequestSchema = z.object({
  /** 开始时间 [timestamp] */
  start_time: z.number(),
  /** 结束时间，开始时间到结束时间的范围不能超过14天 [timestamp] */
  end_time: z.number(),
  /** 需要查询的文件操作者的userid，单次最多可以传100个用户 */
  userid_list: z.array(z.string()).optional(),
  /** 操作类型及来源详情 */
  operation: z.object({ type: z.number(), source: z.number() }).optional(),
  /** 分页游标，由企业微信后台返回，第一次调用可不填 */
  cursor: z.string().optional(),
  /** 限制返回的条数，最多设置为1000 */
  limit: z.number().max(1000).optional(),
});
export type GetFileOperRecordRequest = z.infer<typeof GetFileOperRecordRequestSchema>;
export const GetFileOperRecordResponseSchema = z.object({
  /** 是否还有更多数据 */
  has_more: z.boolean().optional(),
  /** 仅has_more值为true时返回该字段，下一次调用将该值填到cursor字段 */
  next_cursor: z.string().optional(),
  /** 操作记录列表 */
  record_list: z.array(z.object({ time: z.number(), userid: z.string(), external_user: z.object({ type: z.number(), name: z.string(), corp_name: z.string() }), operation: z.object({ type: z.number(), source: z.number() }), file_info: z.string(), file_size: z.number(), file_md5: z.string(), applicant_name: z.string(), device_type: z.number(), device_code: z.string() })).optional(),
});
export type GetFileOperRecordResponse = z.infer<typeof GetFileOperRecordResponseSchema>;

/**
 * 截屏/录屏管理
 * @see https://developer.work.weixin.qq.com/document/path/100128
 */
export const GetScreenOperRecordRequestSchema = z.object({
  /** 开始时间 [timestamp] */
  start_time: z.number(),
  /** 结束时间，开始时间到结束时间的范围不能超过14天 [timestamp] */
  end_time: z.number(),
  /** 需要查询的截屏操作者的userid，单次最多可以传100个用户 */
  userid_list: z.array(z.string()).optional(),
  /** 需要查询的截屏操作者部门的department_id，单次最多可以传100个部门id */
  department_id_list: z.array(z.number()).optional(),
  /** 截屏内容的类型，不设置默认为全部 (1-聊天, 2-通讯录, 3-邮件, 4-文件, 5-日程, 6-其他) */
  screen_shot_type: z.number().optional(),
  /** 由企业微信后台返回，第一次调用可不填 */
  cursor: z.string().min(0).optional(),
  /** 限制返回的条数，最多设置为1000 */
  limit: z.number().min(1).max(1000).optional(),
});
export type GetScreenOperRecordRequest = z.infer<typeof GetScreenOperRecordRequestSchema>;
export const GetScreenOperRecordResponseSchema = z.object({
  /** 是否还有更多数据 */
  has_more: z.boolean().optional(),
  /** 仅has_more值为true时返回该字段，下一次调用将该值填到cursor字段，以实现分页查询 */
  next_cursor: z.string().optional(),
  /** 操作记录列表 */
  record_list: z.array(z.object({ time: z.number(), userid: z.string(), department_id: z.number(), screen_shot_type: z.number(), screen_shot_content: z.string(), system: z.string() })).optional(),
});
export type GetScreenOperRecordResponse = z.infer<typeof GetScreenOperRecordResponseSchema>;

export const GetServerDomainIpResponseSchema = z.object({
  /** 域名列表 */
  domain_list: z.array(z.object({ domain: z.string(), universal_domian: z.string(), protocol: z.string(), port: z.array(z.number()), is_necessary: z.number(), description: z.string() })).optional(),
  /** IP列表 */
  ip_list: z.array(z.object({ ip: z.string(), protocol: z.string(), port: z.array(z.number()), is_necessary: z.number(), description: z.string() })).optional(),
});
export type GetServerDomainIpResponse = z.infer<typeof GetServerDomainIpResponseSchema>;

/**
 * 获取成员操作记录
 * @see https://developer.work.weixin.qq.com/document/path/100178
 */
export const ListMemberOperLogRequestSchema = z.object({
  /** 开始时间 [timestamp] */
  start_time: z.number(),
  /** 结束时间 [timestamp] */
  end_time: z.number(),
  /** 操作类型 (1-添加外部联系人, 2-删除外部联系人, 3-标记企业客户, 4-新设备登录, 5-更换手机号, 6-绑定微信号...) */
  oper_type: z.number().optional(),
  /** 操作者userid过滤 */
  userid: z.string().min(1).max(64).optional(),
  /** 分页游标 */
  cursor: z.string().min(1).optional(),
  /** 最大记录数 */
  limit: z.number().min(1).max(400).default(400).optional(),
});
export type ListMemberOperLogRequest = z.infer<typeof ListMemberOperLogRequestSchema>;
export const ListMemberOperLogResponseSchema = z.object({
  /** 是否还有下一页 */
  has_more: z.boolean().optional(),
  /** 下一页的分页游标 */
  next_cursor: z.string().optional(),
  /** 记录列表 */
  record_list: z.array(z.object({ time: z.number(), userid: z.string(), oper_type: z.number(), detail_info: z.string(), ip: z.string() })).optional(),
});
export type ListMemberOperLogResponse = z.infer<typeof ListMemberOperLogResponseSchema>;

/**
 * 导入可信企业设备
 * @see https://developer.work.weixin.qq.com/document/path/98920
 */
export const ImportTrustDeviceRequestSchema = z.object({
  /** 设备列表，每次调用最多导入100条记录 */
  device_list: z.array(z.object({ system: z.string(), mac_addr: z.array(z.string()), motherboard_uuid: z.string(), harddisk_uuid: z.array(z.string()), domain: z.string(), pc_name: z.string(), seq_no: z.string() })),
});
export type ImportTrustDeviceRequest = z.infer<typeof ImportTrustDeviceRequestSchema>;
export const ImportTrustDeviceResponseSchema = z.object({
  /** 导入结果列表 */
  result: z.array(z.object({ device_index: z.number(), device_code: z.string(), duplicated_device_code: z.string(), status: z.number() })).optional(),
});
export type ImportTrustDeviceResponse = z.infer<typeof ImportTrustDeviceResponseSchema>;

/**
 * 获取高级功能账号列表
 * @see https://developer.work.weixin.qq.com/document/path/99506
 */
export const ListSecurityVipRequestSchema = z.object({
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().optional(),
  /** 用于分页查询，每次请求返回的数据上限。默认100，最大200。注意：不保证每次返回的数据刚好为指定limit，必须用返回的has_more判断是否继续请求 */
  limit: z.number().max(200).default(100).optional(),
});
export type ListSecurityVipRequest = z.infer<typeof ListSecurityVipRequestSchema>;
export const ListSecurityVipResponseSchema = z.object({
  /** 是否还有更多数据未获取 */
  has_more: z.boolean().optional(),
  /** 下一次请求的cursor值 */
  next_cursor: z.string().optional(),
  /** 符合条件的企业成员userid列表 */
  userid_list: z.array(z.string()).optional(),
});
export type ListSecurityVipResponse = z.infer<typeof ListSecurityVipResponseSchema>;

/**
 * 分配高级功能账号
 * @see https://developer.work.weixin.qq.com/document/path/99503
 */
export const SubmitBatchAddJobRequestSchema = z.object({
  /** 要分配高级功能的企业成员userid列表，单次操作最大限制100个 */
  userid_list: z.array(z.string()),
});
export type SubmitBatchAddJobRequest = z.infer<typeof SubmitBatchAddJobRequestSchema>;
export const SubmitBatchAddJobResponseSchema = z.object({
  /** 批量分配高级功能的任务id */
  jobid: z.string().optional(),
  /** 非法的userid 列表，不在应用可见范围的useri以及无法识别的userid */
  invalid_userid_list: z.array(z.string()).optional(),
});
export type SubmitBatchAddJobResponse = z.infer<typeof SubmitBatchAddJobResponseSchema>;

/**
 * 取消高级功能账号
 * @see https://developer.work.weixin.qq.com/document/path/99505
 */
export const BatchDelSecurityVipRequestSchema = z.object({
  /** 要撤销分配高级功能的企业成员userid列表，单次操作最多限制100个 */
  userid_list: z.array(z.string()),
});
export type BatchDelSecurityVipRequest = z.infer<typeof BatchDelSecurityVipRequestSchema>;
export const BatchDelSecurityVipResponseSchema = z.object({
  /** 批量取消高级功能的任务id */
  jobid: z.string().optional(),
  /** 非法的userid列表，不在应用可见范围的useri以及无法识别的userid */
  invalid_userid_list: z.array(z.string()).optional(),
});
export type BatchDelSecurityVipResponse = z.infer<typeof BatchDelSecurityVipResponseSchema>;

