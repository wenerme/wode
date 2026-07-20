// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 创建日历
 * @see https://developer.work.weixin.qq.com/document/path/97719
 */
export const CreateCalendarRequestSchema = z.object({
  /** 日历信息 */
  calendar: z.object({ admins: z.array(z.string()), set_as_default: z.number(), summary: z.string().min(1).max(128), color: z.string(), description: z.string().min(0).max(512), is_public: z.number(), public_range: z.object({ userids: z.array(z.string()), partyids: z.array(z.number()) }), is_corp_calendar: z.number(), shares: z.array(z.object({ userid: z.string(), permission: z.number() })) }),
  /** 授权方安装的应用agentid。仅旧的第三方多应用套件需要填此参数 */
  agentid: z.number().optional(),
});
export type CreateCalendarRequest = z.infer<typeof CreateCalendarRequestSchema>;
export const CreateCalendarResponseSchema = z.object({
  /** 日历ID */
  cal_id: z.string().optional(),
  /** 无效的输入内容 */
  fail_result: z.object({ shares: z.array(z.object({ errcode: z.number(), errmsg: z.string(), userid: z.string() })) }).optional(),
});
export type CreateCalendarResponse = z.infer<typeof CreateCalendarResponseSchema>;

/**
 * 删除日历
 * @see https://developer.work.weixin.qq.com/document/path/97718
 */
export const DeleteCalendarRequestSchema = z.object({
  /** 日历ID */
  cal_id: z.string(),
});
export type DeleteCalendarRequest = z.infer<typeof DeleteCalendarRequestSchema>;

/**
 * 获取日历详情
 * @see https://developer.work.weixin.qq.com/document/path/97717
 */
export const GetCalendarDetailRequestSchema = z.object({
  /** 日历ID列表，调用创建日历接口后获得。一次最多可获取1000条 */
  cal_id_list: z.array(z.string()),
});
export type GetCalendarDetailRequest = z.infer<typeof GetCalendarDetailRequestSchema>;
export const GetCalendarDetailResponseSchema = z.object({
  /** 日历列表 */
  calendar_list: z.array(z.object({ cal_id: z.string(), admins: z.array(z.string()), summary: z.string().min(1).max(128), color: z.string(), description: z.string().min(0).max(512), shares: z.array(z.object({ userid: z.string(), permission: z.number() })), is_public: z.number(), public_range: z.object({ userids: z.array(z.string()), partyids: z.array(z.number()) }), is_corp_calendar: z.number() })).optional(),
});
export type GetCalendarDetailResponse = z.infer<typeof GetCalendarDetailResponseSchema>;

/**
 * 更新日历
 * @see https://developer.work.weixin.qq.com/document/path/97716
 */
export const UpdateCalendarRequestSchema = z.object({
  /** 是否不更新可订阅范围。0-否；1-是。默认值为0，会更新可订阅范围 (0-否, 1-是) */
  skip_public_range: z.number().optional(),
  /** 日历信息 */
  calendar: z.object({ cal_id: z.string().min(1), admins: z.array(z.string()), summary: z.string().min(1).max(128), color: z.string().min(7).max(7), description: z.string().min(0).max(512), public_range: z.object({ userids: z.array(z.string()), partyids: z.array(z.number()) }), shares: z.array(z.object({ userid: z.string().min(1), permission: z.number() })) }),
});
export type UpdateCalendarRequest = z.infer<typeof UpdateCalendarRequestSchema>;
export const UpdateCalendarResponseSchema = z.object({
  /** 无效的输入内容 */
  fail_result: z.object({ shares: z.array(z.object({ errcode: z.number(), errmsg: z.string().min(1), userid: z.string().min(1) })) }).optional(),
});
export type UpdateCalendarResponse = z.infer<typeof UpdateCalendarResponseSchema>;

/**
 * 创建日程
 * @see https://developer.work.weixin.qq.com/document/path/97726
 */
export const CreateScheduleRequestSchema = z.object({
  /** 日程信息 */
  schedule: z.object({ admins: z.array(z.string()), attendees: z.array(z.object({ userid: z.string().max(64) })), summary: z.string().max(128).default('新建事件'), description: z.string().max(1000), reminders: z.object({ is_remind: z.number(), is_repeat: z.number(), remind_before_event_secs: z.number(), remind_time_diffs: z.number(), repeat_type: z.number(), repeat_until: z.number(), is_custom_repeat: z.number(), repeat_interval: z.number().min(1), repeat_day_of_week: z.array(z.number()), repeat_day_of_month: z.array(z.number()), timezone: z.number().min(-12).max(12).default(8) }), location: z.string().max(128), start_time: z.number(), end_time: z.number(), cal_id: z.string().max(64), is_whole_day: z.number() }),
  /** 授权方安装的应用agentid。仅旧的第三方多应用套件需要填此参数 */
  agentid: z.number().optional(),
});
export type CreateScheduleRequest = z.infer<typeof CreateScheduleRequestSchema>;
export const CreateScheduleResponseSchema = z.object({
  /** 日程ID */
  schedule_id: z.string().optional(),
});
export type CreateScheduleResponse = z.infer<typeof CreateScheduleResponseSchema>;

/**
 * 新增日程参与者
 * @see https://developer.work.weixin.qq.com/document/path/97721
 */
export const AddScheduleAttendeesRequestSchema = z.object({
  /** 日程ID。创建日程时返回的ID */
  schedule_id: z.string(),
  /** 日程参与者列表。累计最多支持1000人 */
  attendees: z.array(z.object({ userid: z.string().max(64) })).optional(),
});
export type AddScheduleAttendeesRequest = z.infer<typeof AddScheduleAttendeesRequestSchema>;

/**
 * 取消日程
 * @see https://developer.work.weixin.qq.com/document/path/97725
 */
export const DeleteScheduleRequestSchema = z.object({
  /** 日程ID */
  schedule_id: z.string(),
  /** 操作模式。是重复日程时有效。0-默认删除所有日程；1-仅删除此日程；2-删除本次及后续日程 (0-默认删除所有日程, 1-仅删除此日程, 2-删除本次及后续日程) */
  op_mode: z.number().optional(),
  /** 操作起始时间。仅当操作模式是1或2时有效。该时间必须是重复日程的某一次开始时间 [timestamp] */
  op_start_time: z.number().optional(),
});
export type DeleteScheduleRequest = z.infer<typeof DeleteScheduleRequestSchema>;

/**
 * 删除日程参与者
 * @see https://developer.work.weixin.qq.com/document/path/97722
 */
export const DeleteScheduleAttendeesRequestSchema = z.object({
  /** 日程ID。创建日程时返回的ID */
  schedule_id: z.string(),
  /** 日程参与者列表，最多可添加1000人 */
  attendees: z.array(z.object({ userid: z.string().min(1).max(64) })).optional(),
});
export type DeleteScheduleAttendeesRequest = z.infer<typeof DeleteScheduleAttendeesRequestSchema>;

/**
 * 获取日程详情
 * @see https://developer.work.weixin.qq.com/document/path/97724
 */
export const GetScheduleRequestSchema = z.object({
  /** 日程ID列表。一次最多拉取1000条 */
  schedule_id_list: z.array(z.string()),
});
export type GetScheduleRequest = z.infer<typeof GetScheduleRequestSchema>;
export const GetScheduleResponseSchema = z.object({
  /** 日程列表 */
  schedule_list: z.array(z.object({ schedule_id: z.string(), admins: z.array(z.string()), attendees: z.array(z.object({ userid: z.string(), response_status: z.number() })), summary: z.string(), description: z.string(), reminders: z.object({ is_remind: z.number(), is_repeat: z.number(), remind_before_event_secs: z.number(), remind_time_diffs: z.array(z.number()), repeat_type: z.number(), repeat_until: z.number().min(0), is_custom_repeat: z.number(), repeat_interval: z.number().min(1), repeat_day_of_week: z.array(z.number()), repeat_day_of_month: z.array(z.number()), timezone: z.number().min(-12).max(12).default(8), exclude_time_list: z.array(z.object({ start_time: z.number().min(0) })) }), location: z.string().min(0).max(128), status: z.number(), start_time: z.number().min(0), end_time: z.number().min(0), is_whole_day: z.number(), cal_id: z.string().min(0).max(64) })).optional(),
});
export type GetScheduleResponse = z.infer<typeof GetScheduleResponseSchema>;

/**
 * 获取日历下的日程列表
 * @see https://developer.work.weixin.qq.com/document/path/97723
 */
export const GetScheduleListByCalendarRequestSchema = z.object({
  /** 日历ID */
  cal_id: z.string(),
  /** 分页，偏移量 */
  offset: z.number().min(0).default(0).optional(),
  /** 分页，预期请求的数据量 */
  limit: z.number().min(1).max(1000).default(500).optional(),
});
export type GetScheduleListByCalendarRequest = z.infer<typeof GetScheduleListByCalendarRequestSchema>;
export const GetScheduleListByCalendarResponseSchema = z.object({
  /** 日程列表 */
  schedule_list: z.array(z.object({ schedule_id: z.string(), sequence: z.number(), admins: z.array(z.string()), attendees: z.array(z.object({ userid: z.string(), response_status: z.number() })), summary: z.string(), description: z.string(), reminders: z.object({ is_remind: z.number(), is_repeat: z.number(), remind_before_event_secs: z.number(), repeat_type: z.number(), repeat_until: z.number().min(0).default(0), is_custom_repeat: z.number(), repeat_interval: z.number().min(1), repeat_day_of_week: z.array(z.number()), repeat_day_of_month: z.array(z.number()), timezone: z.number().min(-12).max(12).default(8) }), location: z.string().max(128), start_time: z.number().min(0), end_time: z.number().min(0), status: z.number(), cal_id: z.string().max(64) })).optional(),
});
export type GetScheduleListByCalendarResponse = z.infer<typeof GetScheduleListByCalendarResponseSchema>;

/**
 * 更新日程
 * @see https://developer.work.weixin.qq.com/document/path/97720
 */
export const UpdateScheduleRequestSchema = z.object({
  /** 是否不更新参与人。0-否；1-是。默认为0 (0-否, 1-是) */
  skip_attendees: z.number().optional(),
  /** 操作模式。0-默认全部修改；1-仅修改此日程；2-修改将来的所有日程 (0-默认全部修改, 1-仅修改此日程, 2-修改将来的所有日程) */
  op_mode: z.number().optional(),
  /** 操作起始时间。仅当操作模式是1或2时有效。该时间必须是重复日程的某一次开始时间 [timestamp] */
  op_start_time: z.number().optional(),
  /** 日程信息 */
  schedule: z.object({ schedule_id: z.string().min(1), admins: z.array(z.string()), attendees: z.array(z.object({ userid: z.string().min(1).max(64) })), summary: z.string().min(0).max(128).default('新建事件'), description: z.string().max(1000), reminders: z.object({ is_remind: z.number(), is_repeat: z.number(), remind_before_event_secs: z.number(), remind_time_diffs: z.array(z.number()), repeat_type: z.number(), repeat_until: z.number(), is_custom_repeat: z.number(), repeat_interval: z.number().min(1), repeat_day_of_week: z.array(z.number()), repeat_day_of_month: z.array(z.number()), timezone: z.number().min(-12).max(12).default(8) }), location: z.string().max(128), start_time: z.number(), end_time: z.number(), is_whole_day: z.number() }),
});
export type UpdateScheduleRequest = z.infer<typeof UpdateScheduleRequestSchema>;
export const UpdateScheduleResponseSchema = z.object({
  /** 修改重复日程新产生的日程ID。对于非全部周期修改，会返回新日程的ID */
  schedule_id: z.string().min(1).optional(),
});
export type UpdateScheduleResponse = z.infer<typeof UpdateScheduleResponseSchema>;

