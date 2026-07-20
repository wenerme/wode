// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 创建打卡规则
 * @see https://developer.work.weixin.qq.com/document/path/98057
 */
export const AddCheckinOptionRequestSchema = z.object({
  /** 是否立即生效，默认为false */
  effective_now: z.boolean().default(false).optional(),
  /** 打卡规则详细定义 */
  group: z.object({ groupid: z.number(), grouptype: z.number(), groupname: z.string().min(1).max(32), checkindate: z.array(z.object({ workdays: z.number(), checkintime: z.array(z.object({ time_id: z.number().min(1).max(99998), work_sec: z.number().min(0).max(86400), off_work_sec: z.number().min(0).max(86400), remind_work_sec: z.number().min(0).max(86400), remind_off_work_sec: z.number().min(0).max(86400), earliest_work_sec: z.number().min(0).max(86400), latest_work_sec: z.number().min(0).max(86400), earliest_off_work_sec: z.number().min(0).max(86400), latest_off_work_sec: z.number().min(0).max(86400), allow_rest: z.boolean().default(false), rest_begin_time: z.number().min(0).max(86400), rest_end_time: z.number().min(0).max(86400), no_need_checkon: z.boolean().default(false), no_need_checkoff: z.boolean().default(false), flex_on_duty_time: z.number().min(0).default(0), flex_off_duty_time: z.number().min(0).default(0) })), flex_on_duty_time: z.number().min(0).default(0), flex_off_duty_time: z.number().min(0).default(0), allow_flex: z.boolean().default(false) })), sync_holidays: z.boolean().default(false), need_photo: z.boolean().default(false), note_can_use_local_pic: z.boolean().default(false), wifimac_infos: z.array(z.object({ wifiname: z.string().min(1).max(64), wifimac: z.string().min(17).max(17) })), allow_checkin_offworkday: z.boolean().default(false), allow_apply_offworkday: z.boolean().default(false), loc_infos: z.array(z.object({ lat: z.number().min(-90000000).max(90000000), lng: z.number().min(-180000000).max(180000000), loc_title: z.string().min(1).max(64), loc_detail: z.string().min(0).max(128), distance: z.number().min(10).max(5000).default(300) })), range: z.object({ party_id: z.array(z.number()), userid: z.array(z.string()), tagid: z.array(z.number()) }), white_users: z.array(z.string()), type: z.number(), reporterinfo: z.object({ reporters: z.array(z.object({ userid: z.string().min(1).max(64) })) }), ot_info_v2: z.object({ workdayconf: z.object({ allow_ot: z.boolean().default(false), type: z.number() }) }), allow_apply_bk_cnt: z.number().min(-1).max(30).default(-1), option_out_range: z.number(), use_face_detect: z.boolean().default(false), allow_apply_bk_day_limit: z.number().min(-1).max(30).default(-1), open_face_live_detect: z.boolean().default(false), buka_limit_next_month: z.number().min(-1).max(30).default(-1), sync_out_checkin: z.boolean().default(false), buka_remind: z.object({ open_remind: z.boolean().default(false), buka_remind_day: z.number().min(1).max(30).default(28), buka_remind_month: z.number().min(0).max(12).default(0) }), buka_restriction: z.number(), checkin_method_type: z.number() }),
});
export type AddCheckinOptionRequest = z.infer<typeof AddCheckinOptionRequestSchema>;

/**
 * 添加打卡记录
 * @see https://developer.work.weixin.qq.com/document/path/99647
 */
export const AddCheckinRecordRequestSchema = z.object({
  /** 打卡记录，一批最多200个 */
  records: z.array(z.object({ userid: z.string().min(1), checkin_time: z.number(), location_title: z.string().min(1).max(1024), location_detail: z.string().min(1).max(1024), mediaids: z.array(z.string()), notes: z.string().min(1).max(1024).default(''), device_type: z.number(), lat: z.number().min(-90000000).max(90000000), lng: z.number().min(-180000000).max(180000000), device_detail: z.string().min(1).max(40), wifiname: z.string().min(1).max(1024), wifimac: z.string().min(17).max(17) })),
});
export type AddCheckinRecordRequest = z.infer<typeof AddCheckinRecordRequestSchema>;

/**
 * 录入打卡人员人脸信息
 * @see https://developer.work.weixin.qq.com/document/path/93456
 */
export const AddCheckinUserFaceRequestSchema = z.object({
  /** 需要录入的用户id */
  userid: z.string().max(64).optional(),
  /** 需要录入的人脸图片数据，需要将图片数据base64处理后填入，对已录入的人脸会进行更新处理 [base64] */
  userface: z.string().max(1048576).optional(),
});
export type AddCheckinUserFaceRequest = z.infer<typeof AddCheckinUserFaceRequestSchema>;

/**
 * 获取打卡日报数据
 * @see https://developer.work.weixin.qq.com/document/path/93451
 */
export const GetCheckinDayDataRequestSchema = z.object({
  /** 获取日报的开始时间。0点Unix时间戳 [timestamp] */
  starttime: z.number(),
  /** 获取日报的结束时间。0点Unix时间戳 [timestamp] */
  endtime: z.number(),
  /** 获取日报的userid列表。单个userid不少于1字节，不多于64字节。可填充个数：1 ~ 100 */
  useridlist: z.array(z.string()),
});
export type GetCheckinDayDataRequest = z.infer<typeof GetCheckinDayDataRequestSchema>;
export const GetCheckinDayDataResponseSchema = z.object({
  /** 日报数据列表 */
  datas: z.array(z.object({ base_info: z.object({ date: z.number(), record_type: z.number(), name: z.string(), name_ex: z.string(), departs_name: z.string(), acctid: z.string(), rule_info: z.object({ groupid: z.number(), groupname: z.string(), scheduleid: z.number(), schedulename: z.string(), checkintime: z.array(z.object({ work_sec: z.number(), off_work_sec: z.number() })) }), day_type: z.number() }), summary_info: z.object({ checkin_count: z.number(), regular_work_sec: z.number(), standard_work_sec: z.number(), earliest_time: z.number(), lastest_time: z.number() }), holiday_infos: z.array(z.object({ sp_number: z.string(), sp_title: z.object({ data: z.array(z.object({ text: z.string(), lang: z.string() })) }), sp_description: z.object({ data: z.array(z.object({ text: z.string(), lang: z.string() })) }) })), exception_infos: z.array(z.object({ exception: z.number(), count: z.number(), duration: z.number() })), ot_info: z.object({ ot_status: z.number(), ot_duration: z.number(), exception_duration: z.array(z.number()), workday_over_as_money: z.number() }), sp_items: z.array(z.object({ type: z.number(), vacation_id: z.number(), count: z.number(), duration: z.number(), time_type: z.number(), name: z.string() })) })).optional(),
});
export type GetCheckinDayDataResponse = z.infer<typeof GetCheckinDayDataResponseSchema>;

/**
 * 获取打卡月报数据
 * @see https://developer.work.weixin.qq.com/document/path/93452
 */
export const GetCheckinMonthDataRequestSchema = z.object({
  /** 获取月报的开始时间。0点Unix时间戳 [timestamp] */
  starttime: z.number(),
  /** 获取月报的结束时间。0点Unix时间戳 [timestamp] */
  endtime: z.number(),
  /** 指定员工UserID列表 */
  useridlist: z.array(z.string()),
});
export type GetCheckinMonthDataRequest = z.infer<typeof GetCheckinMonthDataRequestSchema>;
export const GetCheckinMonthDataResponseSchema = z.object({
  /** 月报数据列表 */
  datas: z.array(z.object({ base_info: z.object({ record_type: z.number(), name: z.string(), name_ex: z.string(), departs_name: z.string(), acctid: z.string(), rule_info: z.object({ groupid: z.number(), groupname: z.string() }) }), summary_info: z.object({ work_days: z.number(), regular_days: z.number(), rest_days: z.number(), except_days: z.number(), regular_work_sec: z.number(), standard_work_sec: z.number() }), exception_infos: z.array(z.object({ exception: z.number(), count: z.number(), duration: z.number() })), sp_items: z.array(z.object({ type: z.number(), vacation_id: z.string(), count: z.string(), duration: z.string(), time_type: z.number(), name: z.string() })), overwork_info: z.object({ workday_over_sec: z.number(), holidays_over_sec: z.number(), restdays_over_sec: z.number(), workdays_over_as_vacation: z.number(), workdays_over_as_money: z.number(), restdays_over_as_vacation: z.number(), restdays_over_as_money: z.number(), holidays_over_as_vacation: z.number(), holidays_over_as_money: z.number() }) })).optional(),
});
export type GetCheckinMonthDataResponse = z.infer<typeof GetCheckinMonthDataResponseSchema>;

/**
 * 获取打卡记录数据
 * @see https://developer.work.weixin.qq.com/document/path/93450
 */
export const GetCheckinDataRequestSchema = z.object({
  /** 打卡类型。1：上下班打卡；2：外出打卡；3：全部打卡 (1-上下班打卡, 2-外出打卡, 3-全部打卡) */
  opencheckindatatype: z.number(),
  /** 获取打卡记录的开始时间。Unix时间戳 [timestamp] */
  starttime: z.number(),
  /** 获取打卡记录的结束时间。Unix时间戳 [timestamp] */
  endtime: z.number(),
  /** 需要获取打卡记录的用户列表 */
  useridlist: z.array(z.string()),
});
export type GetCheckinDataRequest = z.infer<typeof GetCheckinDataRequestSchema>;
export const GetCheckinDataResponseSchema = z.object({
  /** 打卡记录列表 */
  checkindata: z.array(z.object({ userid: z.string(), groupname: z.string(), checkin_type: z.string(), exception_type: z.string(), checkin_time: z.number(), location_title: z.string(), location_detail: z.string(), wifiname: z.string(), notes: z.string(), wifimac: z.string(), mediaids: z.array(z.string()), sch_checkin_time: z.number(), groupid: z.number(), schedule_id: z.number(), timeline_id: z.number(), lat: z.number(), lng: z.number(), deviceid: z.string() })).optional(),
});
export type GetCheckinDataResponse = z.infer<typeof GetCheckinDataResponseSchema>;

/**
 * 获取员工打卡规则
 * @see https://developer.work.weixin.qq.com/document/path/93449
 */
export const GetCheckinOptionRequestSchema = z.object({
  /** 需要获取规则的日期当天0点的Unix时间戳 [timestamp] */
  datetime: z.number(),
  /** 需要获取打卡规则的用户列表 */
  useridlist: z.array(z.string()),
});
export type GetCheckinOptionRequest = z.infer<typeof GetCheckinOptionRequestSchema>;
export const GetCheckinOptionResponseSchema = z.object({
  /** 返回的打卡规则列表 */
  info: z.array(z.object({ userid: z.string(), group: z.object({ grouptype: z.number(), groupid: z.number(), groupname: z.string(), open_sp_checkin: z.boolean(), checkindate: z.array(z.object({ workdays: z.array(z.number()), checkintime: z.array(z.object({ work_sec: z.number(), off_work_sec: z.number(), remind_work_sec: z.number(), remind_off_work_sec: z.number() })), flex_time: z.number(), noneed_offwork: z.boolean(), limit_aheadtime: z.number(), flex_on_duty_time: z.number(), flex_off_duty_time: z.number() })), spe_workdays: z.array(z.object({ timestamp: z.number(), notes: z.string() })), spe_offdays: z.array(z.object({ timestamp: z.number(), notes: z.string() })), sync_holidays: z.boolean(), need_photo: z.boolean(), note_can_use_local_pic: z.boolean(), allow_checkin_offworkday: z.boolean(), allow_apply_offworkday: z.boolean(), wifimac_infos: z.array(z.object({ wifiname: z.string(), wifimac: z.string() })), loc_infos: z.array(z.object({ lat: z.number(), lng: z.number(), loc_title: z.string(), loc_detail: z.string(), distance: z.number() })), schedulelist: z.array(z.object({ schedule_id: z.number(), schedule_name: z.string(), time_section: z.array(z.object({ time_id: z.number(), work_sec: z.number(), off_work_sec: z.number(), remind_work_sec: z.number(), remind_off_work_sec: z.number(), allow_rest: z.boolean() })), limit_aheadtime: z.number(), limit_offtime: z.number(), noneed_offwork: z.boolean() })) }) })).optional(),
});
export type GetCheckinOptionResponse = z.infer<typeof GetCheckinOptionResponseSchema>;

/**
 * 获取打卡人员排班信息
 * @see https://developer.work.weixin.qq.com/document/path/93453
 */
export const GetCheckInScheduleListRequestSchema = z.object({
  /** 需要获取排班信息的用户列表（不超过100个） */
  useridlist: z.array(z.string()),
  /** 获取排班信息的开始时间。Unix时间戳 [timestamp] */
  starttime: z.number(),
  /** 获取排班信息的结束时间。Unix时间戳（与starttime跨度不超过一个月） [timestamp] */
  endtime: z.number(),
});
export type GetCheckInScheduleListRequest = z.infer<typeof GetCheckInScheduleListRequestSchema>;
export const GetCheckInScheduleListResponseSchema = z.object({
  /** 排班表信息 */
  schedule_list: z.array(z.object({ userid: z.string(), yearmonth: z.number(), groupid: z.number(), groupname: z.string(), schedule: z.object({ scheduleList: z.array(z.object({ day: z.number(), schedule_info: z.object({ schedule_id: z.number(), schedule_name: z.string(), time_section: z.array(z.object({ id: z.number(), work_sec: z.number(), off_work_sec: z.number(), remind_work_sec: z.number(), remind_off_work_sec: z.number() })) }) })) }) })).optional(),
});
export type GetCheckInScheduleListResponse = z.infer<typeof GetCheckInScheduleListResponseSchema>;

export const GetCorpCheckinOptionResponseSchema = z.object({
  /** 企业规则信息列表 */
  group: z.array(z.object({ grouptype: z.number(), groupid: z.number(), groupname: z.string(), checkindate: z.array(z.object({ workdays: z.array(z.number()), checkintime: z.array(z.object({ work_sec: z.number(), off_work_sec: z.number(), remind_work_sec: z.number(), remind_off_work_sec: z.number() })), noneed_offwork: z.boolean(), limit_aheadtime: z.number(), flex_on_duty_time: z.number(), flex_off_duty_time: z.number() })), spe_workdays: z.array(z.object({ timestamp: z.number(), notes: z.string() })), spe_offdays: z.array(z.object({ timestamp: z.number(), notes: z.string() })), sync_holidays: z.boolean(), need_photo: z.boolean(), note_can_use_local_pic: z.boolean(), allow_checkin_offworkday: z.boolean(), allow_apply_offworkday: z.boolean(), wifimac_infos: z.array(z.object({ wifiname: z.string(), wifimac: z.string() })), loc_infos: z.array(z.object({ lat: z.number(), lng: z.number(), loc_title: z.string(), loc_detail: z.string(), distance: z.number() })), range: z.object({ party_id: z.array(z.string()), userid: z.array(z.string()), tagid: z.array(z.number()) }), create_time: z.number(), white_users: z.array(z.string()), type: z.number(), reporterinfo: z.object({ reporters: z.array(z.object({ userid: z.string() })), updatetime: z.number() }), ot_info: z.object({ type: z.number(), allow_ot_workingday: z.boolean(), allow_ot_nonworkingday: z.boolean(), otcheckinfo: z.object({ ot_workingday_time_start: z.number(), ot_workingday_time_min: z.number(), ot_workingday_time_max: z.number(), ot_nonworkingday_time_min: z.number(), ot_nonworkingday_time_max: z.number(), ot_nonworkingday_spanday_time: z.number(), ot_workingday_restinfo: z.object({ type: z.number(), fix_time_rule: z.object({ fix_time_begin_sec: z.number(), fix_time_end_sec: z.number() }), cal_ottime_rule: z.object({ items: z.array(z.object({ ot_time: z.number(), rest_time: z.number() })) }) }), ot_nonworkingday_restinfo: z.object({ type: z.number(), fix_time_rule: z.object({ fix_time_begin_sec: z.number(), fix_time_end_sec: z.number() }), cal_ottime_rule: z.object({ items: z.array(z.object({ ot_time: z.number(), rest_time: z.number() })) }) }) }), otapplyinfo: z.object({ allow_ot_workingday: z.boolean(), allow_ot_nonworkingday: z.boolean(), uptime: z.number() }), uptime: z.number() }), allow_apply_bk_cnt: z.number().min(-1), option_out_range: z.number(), create_userid: z.string(), use_face_detect: z.boolean(), allow_apply_bk_day_limit: z.number().min(-1), update_userid: z.string(), schedulelist: z.array(z.object({ schedule_id: z.number(), schedule_name: z.string(), time_section: z.array(z.object({ time_id: z.number(), work_sec: z.number(), off_work_sec: z.number(), remind_work_sec: z.number(), remind_off_work_sec: z.number(), rest_begin_time: z.number(), rest_end_time: z.number(), allow_rest: z.boolean(), rest_times: z.array(z.object({ rest_begin_time: z.number(), rest_end_time: z.number() })) })), limit_aheadtime: z.number(), noneed_offwork: z.boolean(), limit_offtime: z.number(), flex_on_duty_time: z.number(), flex_off_duty_time: z.number(), allow_flex: z.boolean(), late_rule: z.object({ allow_offwork_after_time: z.boolean(), timerules: z.array(z.object({ offwork_after_time: z.number(), onwork_flex_time: z.number() })) }), max_allow_arrive_early: z.number(), max_allow_arrive_late: z.number() })), offwork_interval_time: z.number(), checkin_method_type: z.number() })).optional(),
});
export type GetCorpCheckinOptionResponse = z.infer<typeof GetCorpCheckinOptionResponseSchema>;

/**
 * 为打卡人员补卡
 * @see https://developer.work.weixin.qq.com/document/path/95803
 */
export const PunchCorrectionRequestSchema = z.object({
  /** 需要补卡的成员userid */
  userid: z.string().min(1),
  /** 应打卡日期，为当天0点的Unix时间戳 [timestamp] */
  schedule_date_time: z.number().min(0),
  /** 应打卡时间点，相对于打卡日期0点的偏移秒数（如9点整为32400） */
  schedule_checkin_time: z.number().min(0).optional(),
  /** 实际打卡时间，Unix时间戳 [timestamp] */
  checkin_time: z.number().min(0),
  /** 备注信息 */
  remark: z.string().min(0).max(512).optional(),
});
export type PunchCorrectionRequest = z.infer<typeof PunchCorrectionRequestSchema>;

/**
 * 为打卡人员排班
 * @see https://developer.work.weixin.qq.com/document/path/93454
 */
export const SetCheckinScheduleListRequestSchema = z.object({
  /** 打卡规则的规则id，可通过“获取打卡规则”、“获取打卡数据”、“获取打卡人员排班信息”等相关接口获取 */
  groupid: z.number(),
  /** 排班表信息 */
  items: z.array(z.object({ userid: z.string().min(1).max(64), day: z.number().min(1).max(31), schedule_id: z.number().min(0) })),
  /** 排班表月份，格式为年月，如202011 */
  yearmonth: z.number(),
});
export type SetCheckinScheduleListRequest = z.infer<typeof SetCheckinScheduleListRequestSchema>;

/**
 * 获取设备打卡数据
 * @see https://developer.work.weixin.qq.com/document/path/94126
 */
export const GetHardwareCheckinDataRequestSchema = z.object({
  /** 过滤类型，1表示按打卡时间过滤，2表示按设备上传打卡记录的时间过滤 (1-按打卡时间过滤, 2-按设备上传打卡记录的时间过滤) */
  filter_type: z.number().optional(),
  /** Unix时间戳，当filter_type为1时，表示打卡的开始时间；当filter_type为2时，表示设备上传记录的开始时间 [timestamp] */
  starttime: z.number(),
  /** Unix时间戳，当filter_type为1时，表示打卡的结束时间；当filter_type为2时，表示设备上传记录的结束时间 [timestamp] */
  endtime: z.number(),
  /** 需要获取打卡记录的用户列表 */
  useridlist: z.array(z.string()),
});
export type GetHardwareCheckinDataRequest = z.infer<typeof GetHardwareCheckinDataRequestSchema>;
export const GetHardwareCheckinDataResponseSchema = z.object({
  /** 打卡记录列表 */
  checkindata: z.array(z.object({ userid: z.string(), checkin_time: z.number(), device_sn: z.string(), device_name: z.string() })).optional(),
});
export type GetHardwareCheckinDataResponse = z.infer<typeof GetHardwareCheckinDataResponseSchema>;

