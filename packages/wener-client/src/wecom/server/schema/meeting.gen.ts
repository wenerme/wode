// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 添加会议高级布局
 * @see https://developer.work.weixin.qq.com/document/path/99302
 */
export const AddMeetingAdvancedLayoutRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 布局对象列表 */
  layout_list: z.array(z.object({ layout_name: z.string(), page_list: z.array(z.object({ layout_template_id: z.string(), enable_polling: z.boolean().default(false), polling_setting: z.object({ polling_interval_unit: z.number(), polling_interval: z.number().min(1).max(999999), ignore_user_novideo: z.boolean().default(false), ignore_user_absence: z.boolean().default(false) }), user_seat_list: z.array(z.object({ grid_id: z.string(), grid_type: z.number(), video_type: z.number(), user_list: z.array(z.object({ userid: z.string(), tmp_openid: z.string(), nick_name: z.string() })) })) })) })),
});
export type AddMeetingAdvancedLayoutRequest = z.infer<typeof AddMeetingAdvancedLayoutRequestSchema>;
export const AddMeetingAdvancedLayoutResponseSchema = z.object({
  /** 布局对象列表 */
  layout_list: z.array(z.object({ layout_id: z.string(), layout_name: z.string(), page_list: z.array(z.object({ layout_template_id: z.string(), enable_polling: z.boolean().default(false), polling_setting: z.object({ polling_interval_unit: z.number(), polling_interval: z.number().min(1).max(999999), ignore_user_novideo: z.boolean().default(false), ignore_user_absence: z.boolean().default(false) }), user_seat_list: z.array(z.object({ grid_id: z.string(), grid_type: z.number(), video_type: z.number(), user_list: z.array(z.object({ userid: z.string(), tmp_openid: z.string(), nick_name: z.string() })) })) })) })).optional(),
});
export type AddMeetingAdvancedLayoutResponse = z.infer<typeof AddMeetingAdvancedLayoutResponseSchema>;

/**
 * 设置高级布局
 * @see https://developer.work.weixin.qq.com/document/path/99304
 */
export const ApplyMeetingAdvancedLayoutRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 选择应用的布局 ID（若传空""，表示恢复成当前会议的默认布局） */
  layout_id: z.string().min(0),
  /** 用户列表对象数组。如果该字段为空，为会议设置高级自定义布局；如果该字段携带用户，则只为指定用户设置个性布局。单次最多支持20个用户 */
  user_list: z.array(z.object({ tmp_openid: z.string() })).optional(),
});
export type ApplyMeetingAdvancedLayoutRequest = z.infer<typeof ApplyMeetingAdvancedLayoutRequestSchema>;

/**
 * 批量删除布局
 * @see https://developer.work.weixin.qq.com/document/path/99261
 */
export const BatchDeleteLayoutRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 布局 ID 列表，要删除的一个或多个布局 ID（最多支持20个）。当前正在应用的布局不能被删除 */
  layout_id_list: z.array(z.string()),
});
export type BatchDeleteLayoutRequest = z.infer<typeof BatchDeleteLayoutRequestSchema>;

/**
 * 获取用户布局
 * @see https://developer.work.weixin.qq.com/document/path/99260
 */
export const GetUserLayoutRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string().min(1),
  /** 被操作用户临时身份 ID */
  tmp_openid: z.string().min(1),
  /** 被操作用户终端设备类型 ID (0-PSTN, 1-PC, 2-Mac, 3-Android, 4-iOS, 5-Web, 6-iPad, 7-A...) */
  instance_id: z.number(),
});
export type GetUserLayoutRequest = z.infer<typeof GetUserLayoutRequestSchema>;
export const GetUserLayoutResponseSchema = z.object({
  /** 会议应用的布局 ID */
  selected_layout_id: z.string().min(1).optional(),
  /** 布局名称 */
  layout_name: z.string().min(1).optional(),
  /** 布局类型 (0-默认布局, 2-自定义会议布局, 3-个性布局) */
  layout_type: z.number().optional(),
  /** 布局单页对象列表 */
  page_list: z.array(z.object({ layout_template_id: z.string().min(1), enable_polling: z.boolean().default(false), polling_setting: z.object({ polling_interval_unit: z.number(), polling_interval: z.number().min(1).max(999999), ignore_user_absence: z.boolean().default(false), ignore_user_novideo: z.boolean().default(false) }), user_seat_list: z.array(z.object({ grid_id: z.string().min(1), grid_type: z.number(), video_type: z.number(), user_list: z.array(z.object({ tmp_openid: z.string().min(1) })) })) })).optional(),
});
export type GetUserLayoutResponse = z.infer<typeof GetUserLayoutResponseSchema>;

/**
 * 获取会议布局列表
 * @see https://developer.work.weixin.qq.com/document/path/99259
 */
export const ListMeetingAdvancedLayoutRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string().min(1),
});
export type ListMeetingAdvancedLayoutRequest = z.infer<typeof ListMeetingAdvancedLayoutRequestSchema>;
export const ListMeetingAdvancedLayoutResponseSchema = z.object({
  /** 会议应用的布局 ID */
  selected_layout_id: z.string().min(1).optional(),
  /** 布局对象列表 */
  layout_list: z.array(z.object({ layout_id: z.string().min(1), layout_name: z.string().min(1), page_list: z.array(z.object({ layout_template_id: z.string().min(1), enable_polling: z.boolean().default(false), polling_setting: z.object({ polling_interval_unit: z.number(), polling_interval: z.number().min(1).max(999999), ignore_user_novideo: z.boolean(), ignore_user_absence: z.boolean() }), user_seat_list: z.array(z.object({ grid_id: z.string().min(1), grid_type: z.number(), video_type: z.number(), user_list: z.array(z.object({ userid: z.string().min(1), tmp_openid: z.string().min(1), nick_name: z.string().min(1) })) })) })) })).optional(),
});
export type ListMeetingAdvancedLayoutResponse = z.infer<typeof ListMeetingAdvancedLayoutResponseSchema>;

/**
 * 修改会议高级布局
 * @see https://developer.work.weixin.qq.com/document/path/99303
 */
export const UpdateMeetingAdvancedLayoutRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 布局 ID */
  layout_id: z.string(),
  /** 布局名称 */
  layout_name: z.string().optional(),
  /** 布局单页对象列表 */
  page_list: z.array(z.object({ layout_template_id: z.string(), enable_polling: z.boolean().default(false), polling_setting: z.object({ polling_interval_unit: z.number(), polling_interval: z.number().min(1).max(999999), ignore_user_novideo: z.boolean(), ignore_user_absence: z.boolean() }), user_seat_list: z.array(z.object({ grid_id: z.string(), grid_type: z.number(), video_type: z.number(), user_list: z.array(z.object({ userid: z.string(), tmp_openid: z.string() })) })) })),
});
export type UpdateMeetingAdvancedLayoutRequest = z.infer<typeof UpdateMeetingAdvancedLayoutRequestSchema>;

/**
 * 取消预约会议
 * @see https://developer.work.weixin.qq.com/document/path/98990
 */
export const CancelMeetingRequestSchema = z.object({
  /** 会议id，仅允许取消预约状态下的会议 */
  meetingid: z.string(),
  /** 周期性子会议 ID。如果取消周期性会议且该字段不传，则会取消该系列的周期性会议。 */
  sub_meetingid: z.string().optional(),
});
export type CancelMeetingRequest = z.infer<typeof CancelMeetingRequestSchema>;

/**
 * 获取成员设备是否入会
 * @see https://developer.work.weixin.qq.com/document/path/99013
 */
export const CheckMeetingDeviceRequestSchema = z.object({
  /** 企业成员的userid */
  userid: z.string(),
  /** 终端设备类型列表。不带则查询所有设备，带则查询指定设备 (0-PSTN, 1-PC, 2-Mac, 3-Android, 4-iOS, 5-Web, 6-iPad, 7-A...) */
  instance_id_list: z.number().optional(),
  /** 会议 ID 列表。须为本企业创建的会议 */
  meetingid_list: z.array(z.string()),
});
export type CheckMeetingDeviceRequest = z.infer<typeof CheckMeetingDeviceRequestSchema>;
export const CheckMeetingDeviceResponseSchema = z.object({
  /** 结果列表 */
  result_list: z.array(z.object({ meetingid: z.string(), instance_id: z.number() })).optional(),
});
export type CheckMeetingDeviceResponse = z.infer<typeof CheckMeetingDeviceResponseSchema>;

/**
 * 创建预约会议
 * @see https://developer.work.weixin.qq.com/document/path/99104
 */
export const CreateMeetingRequestSchema = z.object({
  /** 会议管理员userid */
  admin_userid: z.string(),
  /** 会议的标题，最多支持40个字节或者20个utf8字符 */
  title: z.string().min(1).max(40),
  /** 会议开始时间的unix时间戳。需大于当前时间 [timestamp] */
  meeting_start: z.number(),
  /** 会议持续时间（单位秒），最小300秒，最大86399秒 */
  meeting_duration: z.number().min(300).max(86399),
  /** 会议的描述，最多支持500个字节或者utf8字符 */
  description: z.string().min(1).max(500).optional(),
  /** 会议地点，最多128个字符 */
  location: z.string().min(1).max(128).optional(),
  /** 授权方安装的应用agentid。仅旧的第三方多应用套件需要填此参数 */
  agentid: z.number().optional(),
  /** 邀请参会的成员。任何userid不合法或者不在应用可见范围，直接报错。参会人数上限不超过指定的「管理员」可预约的人数的上限，普通企业参会人员最多为100人；付费 */
  invitees: z.object({ userid: z.array(z.string()) }).optional(),
  /** 会议所属日历ID。该日历必须是access_token所对应应用所创建的日历。第三方应用必须指定cal_id。不多于64字节 */
  cal_id: z.string().min(1).max(64).optional(),
  /** 会议配置 */
  settings: z.object({ password: z.string().min(4).max(6), enable_waiting_room: z.boolean().default(false), allow_enter_before_host: z.boolean().default(true), remind_scope: z.number(), enable_enter_mute: z.number(), enable_screen_watermark: z.boolean().default(false), hosts: z.object({ userid: z.array(z.string()) }), ring_users: z.object({ userid: z.array(z.string()) }) }).optional(),
  /** 重复会议相关配置 */
  reminders: z.object({ is_repeat: z.number(), repeat_type: z.number(), repeat_until: z.number(), repeat_interval: z.number().max(2), remind_before: z.number() }).optional(),
});
export type CreateMeetingRequest = z.infer<typeof CreateMeetingRequestSchema>;
export const CreateMeetingResponseSchema = z.object({
  /** 会议id，通过此id可调用“进入会议”接口 */
  meetingid: z.string().optional(),
  /** 参会人中包含无效会议账号的userid，仅在购买会议专业版企业由于部分参会人无有效会议账号时返回 */
  excess_users: z.array(z.string()).optional(),
});
export type CreateMeetingResponse = z.infer<typeof CreateMeetingResponseSchema>;

/**
 * 创建用户专属参会链接
 * @see https://developer.work.weixin.qq.com/document/path/98818
 */
export const CreateCustomerShortUrlRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 用户专属字段，需以 {"ver": "1.0", "userData":"自定义字段"} 结构进行 Base64 编码 [base64] */
  customer_data: z.string().max(256),
});
export type CreateCustomerShortUrlRequest = z.infer<typeof CreateCustomerShortUrlRequestSchema>;
export const CreateCustomerShortUrlResponseSchema = z.object({
  /** 用户专属参会链接对象 */
  meeting_short_url_customer_data: z.array(z.object({ customer_data: z.string(), meeting_short_url: z.string() })).optional(),
});
export type CreateCustomerShortUrlResponse = z.infer<typeof CreateCustomerShortUrlResponseSchema>;

/**
 * 审批会议报名信息
 * @see https://developer.work.weixin.qq.com/document/path/98807
 */
export const ApproveMeetingEnrollRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 审批动作：1-取消批准，2-拒绝，3-批准。取消批准后状态将变成待审批。 (1-取消批准, 2-拒绝, 3-批准) */
  action: z.number(),
  /** 报名ID列表 */
  enroll_id_list: z.array(z.string()),
});
export type ApproveMeetingEnrollRequest = z.infer<typeof ApproveMeetingEnrollRequestSchema>;
export const ApproveMeetingEnrollResponseSchema = z.object({
  /** 成功处理的数量 */
  handled_count: z.number().optional(),
});
export type ApproveMeetingEnrollResponse = z.infer<typeof ApproveMeetingEnrollResponseSchema>;

/**
 * 删除会议报名信息
 * @see https://developer.work.weixin.qq.com/document/path/98817
 */
export const DeleteMeetingEnrollRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 报名ID列表 */
  enroll_id_list: z.array(z.object({ enroll_id: z.string() })),
});
export type DeleteMeetingEnrollRequest = z.infer<typeof DeleteMeetingEnrollRequestSchema>;
export const DeleteMeetingEnrollResponseSchema = z.object({
  /** 成功删除的报名信息数量 */
  total_count: z.number().optional(),
});
export type DeleteMeetingEnrollResponse = z.infer<typeof DeleteMeetingEnrollResponseSchema>;

/**
 * 获取会议报名配置
 * @see https://developer.work.weixin.qq.com/document/path/99055
 */
export const GetMeetingEnrollConfigRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
});
export type GetMeetingEnrollConfigRequest = z.infer<typeof GetMeetingEnrollConfigRequestSchema>;
export const GetMeetingEnrollConfigResponseSchema = z.object({
  /** 审批类型：1：自动审批，2：手动审批，默认自动审批 (1-自动审批, 2-手动审批) */
  approve_type: z.number().optional(),
  /** 是否收集问题：1：不收集，默认值为不收集；2：收集 (1-不收集, 2-收集) */
  is_collect_question: z.number().optional(),
  /** 本企业成员无需报名：true：本企业成员无需报名；false：默认配置，本企业成员及企业外成员需要报名 */
  no_registration_needed_for_staff: z.boolean().default(false).optional(),
  /** 报名问题列表，详见Question */
  question_list: z.array(z.object({ is_required: z.number(), question_title: z.string().max(40), option_list: z.array(z.object({ content: z.string().max(40) })), question_type: z.number(), special_type: z.number() })).optional(),
});
export type GetMeetingEnrollConfigResponse = z.infer<typeof GetMeetingEnrollConfigResponseSchema>;

/**
 * 导入会议报名信息
 * @see https://developer.work.weixin.qq.com/document/path/98816
 */
export const ImportMeetingEnrollRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string().min(1),
  /** 报名成员列表 */
  enroll_list: z.array(z.object({ userid: z.string().min(1), area: z.string().min(1), phone_number: z.string().min(1), nick_name: z.string().min(1) })),
});
export type ImportMeetingEnrollRequest = z.infer<typeof ImportMeetingEnrollRequestSchema>;
export const ImportMeetingEnrollResponseSchema = z.object({
  /** 成功导入的报名信息条数 */
  total_count: z.number().min(0).optional(),
  /** 报名成员列表 */
  enroll_list: z.array(z.object({ enroll_id: z.string().min(1), userid: z.string().min(1), area: z.string().min(1), phone_number: z.string().min(1), nick_name: z.string().min(1), enroll_code: z.string().min(1) })).optional(),
});
export type ImportMeetingEnrollResponse = z.infer<typeof ImportMeetingEnrollResponseSchema>;

/**
 * 获取会议报名信息
 * @see https://developer.work.weixin.qq.com/document/path/99054
 */
export const ListMeetingEnrollRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 审批状态筛选字段，默认返回全部。0：全部。1：待审批。2：已拒绝。3：已批准。 (0-全部, 1-待审批, 2-已拒绝, 3-已批准) */
  status: z.number().optional(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值 */
  cursor: z.string().optional(),
  /** 分页大小，最大50条。默认值为50 */
  limit: z.number().min(1).max(50).default(50).optional(),
});
export type ListMeetingEnrollRequest = z.infer<typeof ListMeetingEnrollRequestSchema>;
export const ListMeetingEnrollResponseSchema = z.object({
  /** 是否还有待拉取的成员列表 */
  has_more: z.boolean().optional(),
  /** 分页用，下一次拉取列表将该字段填入cursor字段 */
  next_cursor: z.string().optional(),
  /** 当前页的报名列表。详见Enroll */
  enroll_list: z.array(z.object({ enroll_id: z.string(), enroll_time: z.string(), enroll_source_type: z.number(), nick_name: z.string(), status: z.number(), userid: z.string(), tmp_openid: z.string(), enroll_code: z.string(), answer_list: z.array(z.object({ answer_content: z.array(z.string()), is_required: z.number(), question_num: z.number().min(1), question_title: z.string(), question_type: z.number(), special_type: z.number() })) })).optional(),
});
export type ListMeetingEnrollResponse = z.infer<typeof ListMeetingEnrollResponseSchema>;

/**
 * 获取会议成员报名 ID
 * @see https://developer.work.weixin.qq.com/document/path/99014
 */
export const QueryMeetingEnrollIdByTmpOpenidRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string().min(1),
  /** 查询报名 ID 的排序规则。1：优先查询手机号导入报名，再查询成员手动报名；2：优先查询成员手动报名，再查手机号导入 (1-优先查询手机号导入报名，再查询成员手动报名, 2-优先查询成员手动报名，再查手机号导入) */
  sorting_rules: z.number().optional(),
  /** 当场会议的成员临时 ID 数组，单次最多支持500条 */
  tmp_openid_list: z.array(z.string()),
});
export type QueryMeetingEnrollIdByTmpOpenidRequest = z.infer<typeof QueryMeetingEnrollIdByTmpOpenidRequestSchema>;
export const QueryMeetingEnrollIdByTmpOpenidResponseSchema = z.object({
  /** 成员报名 ID 数组，仅返回已报名成员的报名 ID */
  enroll_id_list: z.array(z.object({ tmp_openid: z.string(), enroll_id: z.string() })).optional(),
});
export type QueryMeetingEnrollIdByTmpOpenidResponse = z.infer<typeof QueryMeetingEnrollIdByTmpOpenidResponseSchema>;

/**
 * 修改会议报名配置
 * @see https://developer.work.weixin.qq.com/document/path/98797
 */
export const SetMeetingEnrollConfigRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 审批类型 (1-自动审批, 2-手动审批) */
  approve_type: z.number().optional(),
  /** 是否收集问题 (1-不收集, 2-收集) */
  is_collect_question: z.number().optional(),
  /** 本企业成员无需报名 (true-本企业成员无需报名, false-默认配置，本企业成员及企业外成员需要报名) */
  no_registration_needed_for_staff: z.boolean().optional(),
  /** 报名问题列表，非特殊问题按传入的顺序排序，特殊问题会优先放在最前面，仅开启收集问题时有效 */
  question_list: z.array(z.object({ is_required: z.number(), question_title: z.string().max(40), option_list: z.array(z.object({ content: z.string().max(40) })), question_type: z.number(), special_type: z.number() })).optional(),
});
export type SetMeetingEnrollConfigRequest = z.infer<typeof SetMeetingEnrollConfigRequestSchema>;
export const SetMeetingEnrollConfigResponseSchema = z.object({
  /** 报名问题数量，不收集问题时该字段返回0 */
  question_count: z.number().min(0).optional(),
});
export type SetMeetingEnrollConfigResponse = z.infer<typeof SetMeetingEnrollConfigResponseSchema>;

/**
 * 获取已参会成员列表
 * @see https://developer.work.weixin.qq.com/document/path/99295
 */
export const ListAttendeeRequestSchema = z.object({
  /** 会议id */
  meetingid: z.string(),
  /** 周期性会议子会议 ID。如果是周期性会议，此参数必传。可通过查询成员的会议列表、查询会议接口获取返回的子会议 ID。 */
  sub_meetingid: z.string().optional(),
  /** 参会时间过滤起始时间（单位秒）。时间区间不允许超过31天，如果为空默认当前时间前推31天；start_time 和 end_time 都没传时最大查询时间跨度9 [timestamp] */
  start_time: z.number().default('当前时间前推31天').optional(),
  /** 参会时间过滤终止时间（单位秒）。时间区间不允许超过31天，如果为空默认取当前时间；start_time 和 end_time 都没传时最大查询时间跨度90天。 [timestamp] */
  end_time: z.number().default('当前时间').optional(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值。limit参数必须与首次调用获得cursor时传入的limit一致。 */
  cursor: z.string().optional(),
  /** 拉取参会成员条数，目前每页支持最大100条。 */
  limit: z.number().max(100).optional(),
});
export type ListAttendeeRequest = z.infer<typeof ListAttendeeRequestSchema>;
export const ListAttendeeResponseSchema = z.object({
  /** 是否还有待拉取的成员列表 */
  has_more: z.boolean().optional(),
  /** 分页用，下一次拉取列表将该字段填入cursor字段 */
  next_cursor: z.string().optional(),
  /** 参会人列表 */
  attendees: z.array(z.object({ tmp_openid: z.string(), userid: z.string(), join_time: z.string(), quit_time: z.string(), instance_id: z.number(), role: z.number(), webinar_role: z.number(), join_type: z.number(), net: z.string(), audio_state: z.boolean(), screen_shared_state: z.boolean(), customer_data: z.string() })).optional(),
});
export type ListAttendeeResponse = z.infer<typeof ListAttendeeResponseSchema>;

/**
 * 获取用户专属参会链接
 * @see https://developer.work.weixin.qq.com/document/path/98819
 */
export const GetCustomerShortUrlRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
});
export type GetCustomerShortUrlRequest = z.infer<typeof GetCustomerShortUrlRequestSchema>;
export const GetCustomerShortUrlResponseSchema = z.object({
  /** 用户专属参会链接对象列表 */
  meeting_short_url_customer_data_list: z.array(z.object({ customer_data: z.string(), meeting_short_url: z.string() })).optional(),
});
export type GetCustomerShortUrlResponse = z.infer<typeof GetCustomerShortUrlResponseSchema>;

/**
 * 获取会议嘉宾列表
 * @see https://developer.work.weixin.qq.com/document/path/99077
 */
export const ListMeetingGuestsRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
});
export type ListMeetingGuestsRequest = z.infer<typeof ListMeetingGuestsRequestSchema>;
export const ListMeetingGuestsResponseSchema = z.object({
  /** 会议ID */
  meetingid: z.string().optional(),
  /** 入会码 */
  meeting_code: z.string().optional(),
  /** 会议主题 */
  title: z.string().optional(),
  /** 嘉宾列表 */
  guests: z.array(z.object({ area: z.string(), phone_number: z.string(), guest_name: z.string() })).optional(),
});
export type ListMeetingGuestsResponse = z.infer<typeof ListMeetingGuestsResponseSchema>;

/**
 * 获取会议详情
 * @see https://developer.work.weixin.qq.com/document/path/99015
 */
export const GetMeetingInfoRequestSchema = z.object({
  /** 会议id。注意：meetingid和meeting_code必须填一个 */
  meetingid: z.string().optional(),
  /** 入会码。注意：meetingid和meeting_code必须填一个 */
  meeting_code: z.string().optional(),
  /** 周期性会议子会议id */
  sub_meetingid: z.string().optional(),
});
export type GetMeetingInfoRequest = z.infer<typeof GetMeetingInfoRequestSchema>;
export const GetMeetingInfoResponseSchema = z.object({
  /** 会议管理员的userId */
  admin_userid: z.string().optional(),
  /** 会议的标题，最大40个字节 */
  title: z.string().max(40).optional(),
  /** 会议开始时间的unix时间戳 [timestamp] */
  meeting_start: z.number().optional(),
  /** 会议时长 */
  meeting_duration: z.number().optional(),
  /** 会议的描述，最大600字节 */
  description: z.string().max(600).optional(),
  /** 会议地点，最多128个字符 */
  location: z.string().max(128).optional(),
  /** 发起人所在部门 */
  main_department: z.number().optional(),
  /** 会议的状态 (1-待开始, 2-会议中, 3-已结束, 4-已取消, 5-已过期) */
  status: z.number().optional(),
  /** 会议类型 (0-一次性会议, 1-周期性会议, 2-微信专属会议, 3-Rooms 投屏会议, 5-个人会议号会议, 6-网络研讨会) */
  meeting_type: z.number().optional(),
  /** 参会成员信息 */
  attendees: z.object({ member: z.array(z.object({ userid: z.string(), status: z.number(), first_join_time: z.number(), last_quit_time: z.number(), total_join_count: z.number(), cumulative_time: z.number() })), tmp_external_user: z.array(z.object({ tmp_external_userid: z.string(), status: z.number(), first_join_time: z.number(), last_quit_time: z.number(), total_join_count: z.number(), cumulative_time: z.number() })) }).optional(),
  /** 会议配置 */
  settings: z.object({ remind_scope: z.number(), need_password: z.boolean(), password: z.string(), enable_waiting_room: z.boolean(), allow_enter_before_host: z.boolean(), enable_enter_mute: z.number(), allow_unmute_self: z.boolean(), allow_external_user: z.boolean(), enable_screen_watermark: z.boolean(), watermark_type: z.number(), auto_record_type: z.string(), attendee_join_auto_record: z.boolean(), enable_host_pause_auto_record: z.boolean(), enable_doc_upload_permission: z.boolean(), enable_enroll: z.boolean(), enable_host_key: z.boolean(), host_key: z.string(), hosts: z.object({ userid: z.array(z.string()) }), current_hosts: z.object({ userid: z.array(z.string()) }), co_hosts: z.object({ userid: z.array(z.string()) }), ring_users: z.object({ userid: z.array(z.string()) }) }).optional(),
  /** 日历ID */
  cal_id: z.string().optional(),
  /** 重复会议相关配置 */
  reminders: z.object({ is_repeat: z.number(), repeat_type: z.number(), is_custom_repeat: z.number(), repeat_interval: z.number(), repeat_day_of_week: z.string(), repeat_day_of_month: z.string(), repeat_until_type: z.number(), repeat_until_count: z.number(), repeat_until: z.number(), remind_before: z.number() }).optional(),
  /** 会议号 */
  meeting_code: z.string().optional(),
  /** 入会链接 */
  meeting_link: z.string().optional(),
  /** 是否有投票（会议创建人和主持人才有权限查询） */
  has_vote: z.boolean().optional(),
  /** 是否还有更多子会议特例 (0-无更多, 1-有更多子会议特例) */
  has_more_sub_meeting: z.number().optional(),
  /** 剩余子会议场数 */
  remain_sub_meetings: z.number().optional(),
  /** 当前子会议ID（进行中/即将开始） */
  current_sub_meetingid: z.string().optional(),
  /** 周期性子会议列表 */
  sub_meetings: z.array(z.object({ sub_meetingid: z.string(), status: z.number(), start_time: z.number(), end_time: z.number(), title: z.string(), repeat_id: z.string() })).optional(),
  /** 会议嘉宾列表 */
  guests: z.array(z.object({ area: z.string(), phone_number: z.string(), guest_name: z.string() })).optional(),
  /** 周期性会议分段信息 */
  sub_repeat_list: z.array(z.object({ repeat_id: z.string(), repeat_type: z.number(), is_custom_repeat: z.number(), repeat_interval: z.number(), repeat_day_of_week: z.string(), repeat_day_of_month: z.string(), repeat_until_type: z.number(), repeat_until_count: z.number(), repeat_until: z.number() })).optional(),
});
export type GetMeetingInfoResponse = z.infer<typeof GetMeetingInfoResponseSchema>;

/**
 * 获取会议受邀成员列表
 * @see https://developer.work.weixin.qq.com/document/path/98160
 */
export const ListMeetingInviteesRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string().min(1),
  /** 分页查询用，将上一个请求返回的 next_cursor 字段传入。第一次查询时可不传值 */
  cursor: z.string().min(0).optional(),
});
export type ListMeetingInviteesRequest = z.infer<typeof ListMeetingInviteesRequestSchema>;
export const ListMeetingInviteesResponseSchema = z.object({
  /** 是否还有尚未拉取的成员列表 */
  has_more: z.boolean().optional(),
  /** 当 has_more 为 true 时，下次查询时输入参数 cursor 的值 */
  next_cursor: z.string().optional(),
  /** 受邀成员列表 */
  invitees: z.array(z.object({ userid: z.string().min(1) })).optional(),
});
export type ListMeetingInviteesResponse = z.infer<typeof ListMeetingInviteesResponseSchema>;

/**
 * 获取会议健康度
 * @see https://developer.work.weixin.qq.com/document/path/99053
 */
export const GetMeetingQualityRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 周期性子会议ID。如果是周期性会议，此参数必传 */
  sub_meetingid: z.string().optional(),
  /** 参会时间过滤起始时间，UNIX 时间戳（单位秒），可查询的时间区间为过去7天到现在 [timestamp] */
  start_time: z.number(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值 */
  cursor: z.string().optional(),
  /** 分页大小，默认50，最大50 */
  limit: z.number().max(50).default(50).optional(),
});
export type GetMeetingQualityRequest = z.infer<typeof GetMeetingQualityRequestSchema>;
export const GetMeetingQualityResponseSchema = z.object({
  /** 健康度 (0-无数据, 1-健康, 2-告警) */
  quality: z.number().optional(),
  /** 音频质量 (0-无数据, 1-好, 2-较好, 3-中, 4-差) */
  audio_quality: z.number().optional(),
  /** 视频质量 (0-无数据, 1-好, 2-较好, 3-中, 4-差) */
  video_quality: z.number().optional(),
  /** 共享屏幕质量 (0-无数据, 1-好, 2-较好, 3-中, 4-差) */
  screen_share_quality: z.number().optional(),
  /** 网络质量 (0-无数据, 1-好, 2-较好, 3-中, 4-差) */
  network_quality: z.number().optional(),
  /** 告警的具体问题列表 */
  problems: z.array(z.string()).optional(),
  /** 参会人员健康度列表（按成员入会时间正序排列） */
  attendees: z.array(z.object({ userid: z.string(), tmp_openid: z.string(), instance_id: z.number(), quality: z.number(), audio_quality: z.number(), video_quality: z.number(), screen_share_quality: z.number(), network_quality: z.number(), problems: z.array(z.string()) })).optional(),
  /** 分页用，下一次拉取列表将该字段填入cursor字段 */
  next_cursor: z.string().optional(),
  /** 是否还有待拉取的列表 */
  has_more: z.boolean().optional(),
});
export type GetMeetingQualityResponse = z.infer<typeof GetMeetingQualityResponseSchema>;

/**
 * 获取实时会中成员列表
 * @see https://developer.work.weixin.qq.com/document/path/99012
 */
export const ListRealtimeAttendeeRequestSchema = z.object({
  /** 会议id */
  meetingid: z.string(),
  /** 周期性会议子会议 ID。如果是周期性会议，此参数必传。 */
  sub_meetingid: z.string().optional(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值 */
  cursor: z.string().optional(),
  /** 单次查询返回的数量，最大50条。必须与首次调用获得cursor时传入的limit一致。 */
  limit: z.number().max(50).optional(),
});
export type ListRealtimeAttendeeRequest = z.infer<typeof ListRealtimeAttendeeRequestSchema>;
export const ListRealtimeAttendeeResponseSchema = z.object({
  /** 是否还有更多的成员列表 */
  has_more: z.boolean().optional(),
  /** 分页用，下一次拉取列表将该字段填入cursor字段 */
  next_cursor: z.string().optional(),
  /** 参会人列表 */
  attendees: z.array(z.object({ userid: z.string(), tmp_openid: z.string(), join_time: z.string(), instance_id: z.number(), role: z.number(), join_type: z.number(), audio_state: z.boolean(), video_state: z.boolean(), screen_shared_state: z.boolean() })).optional(),
});
export type ListRealtimeAttendeeResponse = z.infer<typeof ListRealtimeAttendeeResponseSchema>;

/**
 * 获取成员会议ID列表
 * @see https://developer.work.weixin.qq.com/document/path/99050
 */
export const GetUserMeetingIdRequestSchema = z.object({
  /** 企业成员的userid */
  userid: z.string(),
  /** 上一次调用时返回的cursor，初次调用可以填"0" */
  cursor: z.string().default('"0"').optional(),
  /** 开始时间 [timestamp] */
  begin_time: z.number().optional(),
  /** 结束时间，时间跨度不超过180天。如果begin_time和end_time都没填的话，默认end_time为当前时间 [timestamp] */
  end_time: z.number().default('当前时间').optional(),
  /** 每次拉取的数据量，默认值和最大值都为100 */
  limit: z.number().max(100).default(100).optional(),
});
export type GetUserMeetingIdRequest = z.infer<typeof GetUserMeetingIdRequestSchema>;
export const GetUserMeetingIdResponseSchema = z.object({
  /** 当前数据最后一个key值，用于分页拉取。未返回或为空字符串表示数据已取完 */
  next_cursor: z.string().optional(),
  /** 会议ID列表，可能为空 */
  meetingid_list: z.array(z.string()).optional(),
});
export type GetUserMeetingIdResponse = z.infer<typeof GetUserMeetingIdResponseSchema>;

/**
 * 添加会议基础布局
 * @see https://developer.work.weixin.qq.com/document/path/99300
 */
export const AddMeetingLayoutRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 布局对象列表，最多10个 */
  layout_list: z.array(z.object({ page_list: z.array(z.object({ layout_template_id: z.string(), user_seat_list: z.array(z.object({ grid_id: z.string(), grid_type: z.number(), userid: z.string(), tmp_openid: z.string(), nick_name: z.string(), tool_sdkid: z.string() })) })) })),
  /** 布局列表中会议需要应用的布局序号，从1开始计数。首次添加时若该参数不送，则默认选中第一个布局作为会议应用的布局 */
  default_layout_order: z.number().min(1).default(1).optional(),
});
export type AddMeetingLayoutRequest = z.infer<typeof AddMeetingLayoutRequestSchema>;
export const AddMeetingLayoutResponseSchema = z.object({
  /** 会议应用的布局 ID */
  selected_layout_id: z.string().optional(),
  /** 布局对象列表 */
  layout_list: z.array(z.object({ layout_id: z.string(), page_list: z.array(z.object({ layout_template_id: z.string(), user_seat_list: z.array(z.object({ grid_id: z.string(), grid_type: z.number(), userid: z.string(), tmp_openid: z.string(), nick_name: z.string(), tool_sdkid: z.string() })) })) })).optional(),
});
export type AddMeetingLayoutResponse = z.infer<typeof AddMeetingLayoutResponseSchema>;

/**
 * 添加会议背景
 * @see https://developer.work.weixin.qq.com/document/path/98851
 */
export const AddMeetingBackgroundRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 图片对象列表，一场会议最多添加7个背景 */
  image_list: z.array(z.object({ image_md5: z.string(), image_url: z.string() })),
  /** 图片列表中会议需要使用的背景图片序号，从1开始计数。不填默认为1 */
  default_image_order: z.number().min(1).default(1).optional(),
});
export type AddMeetingBackgroundRequest = z.infer<typeof AddMeetingBackgroundRequestSchema>;
export const AddMeetingBackgroundResponseSchema = z.object({
  /** 会议应用的背景 ID */
  selected_background_id: z.string().optional(),
  /** 背景对象列表 */
  background_list: z.array(z.object({ background_id: z.string(), image_md5: z.string() })).optional(),
});
export type AddMeetingBackgroundResponse = z.infer<typeof AddMeetingBackgroundResponseSchema>;

/**
 * 批量删除会议背景
 * @see https://developer.work.weixin.qq.com/document/path/98854
 */
export const BatchDeleteMeetingBackgroundRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 背景 ID 列表 */
  background_id_list: z.array(z.string()),
});
export type BatchDeleteMeetingBackgroundRequest = z.infer<typeof BatchDeleteMeetingBackgroundRequestSchema>;

/**
 * 删除会议背景
 * @see https://developer.work.weixin.qq.com/document/path/98853
 */
export const DeleteMeetingBackgroundRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 背景 ID */
  background_id: z.string(),
});
export type DeleteMeetingBackgroundRequest = z.infer<typeof DeleteMeetingBackgroundRequestSchema>;

/**
 * 获取会议背景列表
 * @see https://developer.work.weixin.qq.com/document/path/99224
 */
export const ListMeetingBackgroundsRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
});
export type ListMeetingBackgroundsRequest = z.infer<typeof ListMeetingBackgroundsRequestSchema>;
export const ListMeetingBackgroundsResponseSchema = z.object({
  /** 会议应用的背景 ID */
  selected_background_id: z.string().optional(),
  /** 背景对象列表 */
  background_list: z.array(z.object({ background_id: z.string(), image_md5: z.string() })).optional(),
});
export type ListMeetingBackgroundsResponse = z.infer<typeof ListMeetingBackgroundsResponseSchema>;

export const ListMeetingLayoutTemplateResponseSchema = z.object({
  /** 布局模板对象列表 */
  layout_template_list: z.array(z.record(z.string(), z.any())).optional(),
});
export type ListMeetingLayoutTemplateResponse = z.infer<typeof ListMeetingLayoutTemplateResponseSchema>;

/**
 * 设置会议默认布局
 * @see https://developer.work.weixin.qq.com/document/path/98847
 */
export const SetMeetingDefaultLayoutRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 会议应用的布局 ID（若送空""，表示恢复成会议自带的默认原始布局） */
  selected_layout_id: z.string(),
});
export type SetMeetingDefaultLayoutRequest = z.infer<typeof SetMeetingDefaultLayoutRequestSchema>;

/**
 * 设置会议默认背景
 * @see https://developer.work.weixin.qq.com/document/path/98852
 */
export const SetMeetingDefaultBackgroundRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 会议应用的背景 ID（若送空""，则表示恢复成会议默认的黑色背景） */
  selected_background_id: z.string(),
});
export type SetMeetingDefaultBackgroundRequest = z.infer<typeof SetMeetingDefaultBackgroundRequestSchema>;

/**
 * 修改会议基础布局
 * @see https://developer.work.weixin.qq.com/document/path/99301
 */
export const UpdateMeetingLayoutRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 布局 ID */
  layout_id: z.string(),
  /** 布局对象列表 */
  page_list: z.array(z.object({ layout_template_id: z.string(), user_seat_list: z.array(z.object({ grid_id: z.string(), grid_type: z.number(), userid: z.string().max(64), tmp_openid: z.string().max(128), nick_name: z.string().min(1).max(64), tool_sdkid: z.string().max(64) })) })),
  /** 是否设置为会议应用的布局，默认不设置 */
  enable_set_default: z.boolean().default(false).optional(),
});
export type UpdateMeetingLayoutRequest = z.infer<typeof UpdateMeetingLayoutRequestSchema>;

/**
 * 挂断 MRA 呼叫
 * @see https://developer.work.weixin.qq.com/document/path/99036
 */
export const HangupMraCallRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** MRA设备信息 */
  mra: z.object({ tmp_openid: z.string() }),
});
export type HangupMraCallRequest = z.infer<typeof HangupMraCallRequestSchema>;

/**
 * 获取 MRA 状态信息
 * @see https://developer.work.weixin.qq.com/document/path/99033
 */
export const QueryMraStatusRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string().min(1),
  /** 被查询成员临时身份 ID */
  tmp_openid: z.string().min(1),
});
export type QueryMraStatusRequest = z.infer<typeof QueryMraStatusRequestSchema>;
export const QueryMraStatusResponseSchema = z.object({
  /** 被查询成员当场会议的成员临时 ID */
  tmp_openid: z.string().optional(),
  /** 被查询成员的终端设备类型：9：voip、sip 设备（即MRA设备） */
  instance_id: z.number().optional(),
  /** 成员角色 (0-普通成员角色, 1-创建者角色, 2-主持人, 3-创建者+主持人, 4-小程序, 5-小程序+主持人, 6-...) */
  user_role: z.number().optional(),
  /** 网络研讨会成员角色 (0-普通参会角色, 1-内部嘉宾, 2-外部嘉宾, 3-邀请链接入会嘉宾, 4-观众) */
  webinar_member_role: z.number().optional(),
  /** 成员的 IP 地址。当成员在会中时才能返回 */
  ip: z.string().optional(),
  /** 成员当前显示名称 */
  name: z.string().optional(),
  /** 麦克风状态：true：开启，false：关闭 */
  audio_state: z.boolean().optional(),
  /** 摄像头状态：true：开启，false：关闭 */
  video_state: z.boolean().optional(),
  /** 屏幕共享状态：true：开启，false：关闭 */
  screen_shared_state: z.boolean().optional(),
  /** 当前成员的默认分屏设置 (1-等分模式, 2-全屏模式, 3-1+N) */
  default_layout: z.number().optional(),
  /** 举手状态：true：举手中，false：手放下 */
  raise_hands_state: z.boolean().optional(),
});
export type QueryMraStatusResponse = z.infer<typeof QueryMraStatusResponseSchema>;

/**
 * 设置 MRA 举手或手放下
 * @see https://developer.work.weixin.qq.com/document/path/98788
 */
export const SetMRAHandRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** MRA设备举手操作：true表示举手，false表示手放下 (true-举手, false-手放下) */
  raise_hand: z.boolean(),
  /** MRA设备信息对象 */
  mra: z.object({ tmp_openid: z.string() }),
});
export type SetMRAHandRequest = z.infer<typeof SetMRAHandRequestSchema>;

/**
 * 批量外呼
 * @see https://developer.work.weixin.qq.com/document/path/98823
 */
export const BatchPhoneCalloutRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 外呼的电话号码对象数组 */
  phone_numbers: z.array(z.object({ area: z.string(), phone: z.string().min(1), extension_number: z.string().min(1) })),
});
export type BatchPhoneCalloutRequest = z.infer<typeof BatchPhoneCalloutRequestSchema>;
export const BatchPhoneCalloutResponseSchema = z.object({
  /** 成功外呼的电话号码对象数组 */
  phone_numbers: z.array(z.object({ area: z.string(), phone: z.string().min(1), extension_number: z.string().min(1), status: z.string().min(1) })).optional(),
  /** 不合法的外呼电话号码对象数组 */
  invalid_phone_numbers: z.array(z.object({ area: z.string(), phone: z.string().min(1), extension_number: z.string().min(1) })).optional(),
});
export type BatchPhoneCalloutResponse = z.infer<typeof BatchPhoneCalloutResponseSchema>;

/**
 * 获取会议的外呼状态
 * @see https://developer.work.weixin.qq.com/document/path/99096
 */
export const GetMeetingCalloutStatusRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值 */
  cursor: z.string().optional(),
  /** 分页大小，默认20，最大100 */
  limit: z.number().max(100).default(20).optional(),
});
export type GetMeetingCalloutStatusRequest = z.infer<typeof GetMeetingCalloutStatusRequestSchema>;
export const GetMeetingCalloutStatusResponseSchema = z.object({
  /** 电话号码对象数组 */
  phone_numbers: z.array(z.object({ area: z.number(), phone: z.string(), extension_number: z.string(), status: z.string(), tmp_openid: z.string() })).optional(),
  /** 分页用，下一次拉取列表将该字段填入cursor字段 */
  next_cursor: z.string().optional(),
  /** 是否还有待拉取的列表 */
  has_more: z.boolean().optional(),
});
export type GetMeetingCalloutStatusResponse = z.infer<typeof GetMeetingCalloutStatusResponseSchema>;

/**
 * 获取电话入会的成员ID
 * @see https://developer.work.weixin.qq.com/document/path/99097
 */
export const GetMeetingPhoneTmpOpenIdRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 外呼的电话号码对象数组，上限20个 */
  phone_numbers: z.array(z.object({ area: z.string(), phone: z.string(), extension_number: z.string() })),
});
export type GetMeetingPhoneTmpOpenIdRequest = z.infer<typeof GetMeetingPhoneTmpOpenIdRequestSchema>;
export const GetMeetingPhoneTmpOpenIdResponseSchema = z.object({
  /** 返回的 tmp_openid 对象数组 */
  tmp_openid_list: z.array(z.object({ area: z.string(), phone: z.string(), extension_number: z.string(), tmp_openid: z.string() })).optional(),
});
export type GetMeetingPhoneTmpOpenIdResponse = z.infer<typeof GetMeetingPhoneTmpOpenIdResponseSchema>;

/**
 * 创建会议投票主题
 * @see https://developer.work.weixin.qq.com/document/path/98834
 */
export const CreateMeetingPollThemeRequestSchema = z.object({
  /** 操作者的openid */
  operator_userid: z.string(),
  /** 操作者入会所用的设备id */
  instance_id: z.number(),
  /** 会议ID */
  meetingid: z.string(),
  /** 投票主题，最多50个字符 */
  poll_topic: z.string().max(50),
  /** 投票主题描述，最多100个字符 */
  poll_desc: z.string().max(100),
  /** 是否匿名 (0-实名, 1-匿名) */
  is_anony: z.number().optional(),
  /** 投票问题数组，每个投票支持添加10个问题 */
  poll_questions: z.array(z.object({ question_desc: z.string().max(50), question_type: z.number(), poll_option: z.array(z.string()) })),
});
export type CreateMeetingPollThemeRequest = z.infer<typeof CreateMeetingPollThemeRequestSchema>;
export const CreateMeetingPollThemeResponseSchema = z.object({
  /** 投票主题 ID */
  poll_theme_id: z.string().optional(),
});
export type CreateMeetingPollThemeResponse = z.infer<typeof CreateMeetingPollThemeResponseSchema>;

/**
 * 删除会议投票
 * @see https://developer.work.weixin.qq.com/document/path/98839
 */
export const DeleteMeetingPollRequestSchema = z.object({
  /** 操作者的openid */
  operator_userid: z.string(),
  /** 操作者入会的设备id */
  instance_id: z.number(),
  /** 会议ID */
  meetingid: z.string(),
  /** 投票主题 ID，传入则代表删除投票主题，删除投票主题不影响投票实例。投票主题 ID 和投票 ID 二选一，如果都传入，会使用投票 ID。 */
  poll_theme_id: z.string().optional(),
  /** 投票 ID，传入则代表删除投票实例。当主题下所有主题实例被删，则投票主题也被删除。投票主题 ID 和投票 ID 二选一，如果都传入，会使用投票 ID。 */
  poll_id: z.string().optional(),
});
export type DeleteMeetingPollRequest = z.infer<typeof DeleteMeetingPollRequestSchema>;

/**
 * 结束会议投票
 * @see https://developer.work.weixin.qq.com/document/path/98841
 */
export const FinishMeetingPollRequestSchema = z.object({
  /** 操作者openid */
  operator_userid: z.string(),
  /** 操作者入会设备id */
  instance_id: z.number(),
  /** 会议ID */
  meetingid: z.string(),
  /** 投票主题ID */
  poll_theme_id: z.string(),
  /** 投票ID */
  poll_id: z.string(),
});
export type FinishMeetingPollRequest = z.infer<typeof FinishMeetingPollRequestSchema>;

/**
 * 获取会议投票详情
 * @see https://developer.work.weixin.qq.com/document/path/99218
 */
export const GetPollDetailRequestSchema = z.object({
  /** 操作者openid */
  operator_userid: z.string(),
  /** 操作者入会设备对应的id */
  instance_id: z.number(),
  /** 会议ID */
  meetingid: z.string(),
  /** 投票ID */
  poll_id: z.string(),
});
export type GetPollDetailRequest = z.infer<typeof GetPollDetailRequestSchema>;
export const GetPollDetailResponseSchema = z.object({
  /** 投票主题id */
  poll_theme_id: z.string().optional(),
  /** 投票主题 */
  poll_topic: z.string().optional(),
  /** 投票描述 */
  poll_desc: z.string().optional(),
  /** 是否匿名 (0-实名, 1-匿名) */
  is_anony: z.number().optional(),
  /** 投票状态 (1-投票中, 2-已结束) */
  status: z.number().optional(),
  /** 是否共享 */
  is_shared: z.number().optional(),
  /** 投票人数 */
  vote_total_num: z.number().optional(),
  /** 投票结果数组 */
  poll_question_data: z.array(z.object({ question_desc: z.string(), question_type: z.number(), question_id: z.string(), option_info: z.array(z.object({ option_id: z.number(), option_desc: z.string(), option_num: z.number(), rate: z.number(), option_user: z.array(z.object({ userid: z.string(), tmp_openid: z.string() })) })) })).optional(),
});
export type GetPollDetailResponse = z.infer<typeof GetPollDetailResponseSchema>;

/**
 * 获取会议投票列表
 * @see https://developer.work.weixin.qq.com/document/path/99216
 */
export const ListMeetingPollRequestSchema = z.object({
  /** 操作者openid */
  operator_userid: z.string(),
  /** 操作者入会设备对应的id */
  instance_id: z.number(),
  /** 会议ID */
  meetingid: z.string(),
});
export type ListMeetingPollRequest = z.infer<typeof ListMeetingPollRequestSchema>;
export const ListMeetingPollResponseSchema = z.object({
  /** 投票主题信息列表 */
  polls_theme_info: z.array(z.object({ poll_theme_id: z.string(), polls_info: z.array(z.object({ poll_id: z.string(), poll_topic: z.string(), status: z.number(), is_shared: z.number(), is_anony: z.number() })) })).optional(),
});
export type ListMeetingPollResponse = z.infer<typeof ListMeetingPollResponseSchema>;

/**
 * 获取会议投票主题信息
 * @see https://developer.work.weixin.qq.com/document/path/99217
 */
export const GetMeetingPollThemeInfoRequestSchema = z.object({
  /** 操作者openid */
  operator_userid: z.string(),
  /** 操作者入会设备对应的id */
  instance_id: z.number(),
  /** 会议ID */
  meetingid: z.string().optional(),
  /** 投票主题id */
  poll_theme_id: z.string(),
});
export type GetMeetingPollThemeInfoRequest = z.infer<typeof GetMeetingPollThemeInfoRequestSchema>;
export const GetMeetingPollThemeInfoResponseSchema = z.object({
  /** 投票主题 */
  poll_topic: z.string().optional(),
  /** 投票描述 */
  poll_desc: z.string().optional(),
  /** 是否匿名。0：实名，1：匿名 (0-实名, 1-匿名) */
  is_anony: z.number().optional(),
  /** 投票问题数组 */
  poll_question_data: z.array(z.object({ question_desc: z.string().max(50), question_type: z.number(), option_info: z.array(z.object({ option_desc: z.string() })) })).optional(),
});
export type GetMeetingPollThemeInfoResponse = z.infer<typeof GetMeetingPollThemeInfoResponseSchema>;

/**
 * 发起会议投票
 * @see https://developer.work.weixin.qq.com/document/path/98840
 */
export const StartMeetingPollRequestSchema = z.object({
  /** 操作者openid */
  operator_userid: z.string(),
  /** 操作者入会的设备id */
  instance_id: z.number(),
  /** 会议ID */
  meetingid: z.string(),
  /** 投票主题ID */
  poll_theme_id: z.string(),
});
export type StartMeetingPollRequest = z.infer<typeof StartMeetingPollRequestSchema>;
export const StartMeetingPollResponseSchema = z.object({
  /** 投票ID */
  poll_id: z.string().optional(),
});
export type StartMeetingPollResponse = z.infer<typeof StartMeetingPollResponseSchema>;

/**
 * 修改会议投票主题
 * @see https://developer.work.weixin.qq.com/document/path/98835
 */
export const UpdateMeetingPollThemeRequestSchema = z.object({
  /** 操作者openid */
  operator_userid: z.string(),
  /** 操作者入会设备对应的id */
  instance_id: z.number(),
  /** 会议ID */
  meetingid: z.string(),
  /** 投票主题id */
  poll_theme_id: z.string(),
  /** 投票主题，最多50个字符。 */
  poll_topic: z.string().max(50),
  /** 投票主题描述，最多100个字符。 */
  poll_desc: z.string().max(100),
  /** 是否匿名。0：实名，默认值；1：匿名 (0-实名, 1-匿名) */
  is_anony: z.number().optional(),
  /** 投票问题数组，每个投票支持添加10个问题。详见Question */
  poll_questions: z.array(z.object({ question_desc: z.string().max(50), question_type: z.number(), poll_option: z.array(z.string()) })),
});
export type UpdateMeetingPollThemeRequest = z.infer<typeof UpdateMeetingPollThemeRequestSchema>;

/**
 * 关闭成员屏幕共享
 * @see https://developer.work.weixin.qq.com/document/path/99094
 */
export const CloseScreenShareRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 被操作对象 */
  operated_user: z.array(z.object({ tmp_openid: z.string().min(1), instance_id: z.number() })),
});
export type CloseScreenShareRequest = z.infer<typeof CloseScreenShareRequestSchema>;

/**
 * 结束会议
 * @see https://developer.work.weixin.qq.com/document/path/98187
 */
export const DismissMeetingRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 是否强制结束会议 (0-不强制结束会议，会议中有参会者，则无法强制结束会议, 1-强制结束会议，会议中有参会者，也会强制结束会议) */
  force_dismiss: z.number().optional(),
  /** 是否回收会议号 (0-不回收会议号，可以重新入会, 1-回收会议号，不可重新入会) */
  retrieve_code: z.number().optional(),
});
export type DismissMeetingRequest = z.infer<typeof DismissMeetingRequestSchema>;

/**
 * 移出成员
 * @see https://developer.work.weixin.qq.com/document/path/99051
 */
export const KickoutMeetingUsersRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 是否允许再次入会：true:允许再次入会; false：不允许 (true-允许再次入会, false-不允许) */
  allow_rejoin: z.boolean(),
  /** 被操作对象列表 */
  operated_users: z.array(z.object({ tmp_openid: z.string(), instance_id: z.number() })),
});
export type KickoutMeetingUsersRequest = z.infer<typeof KickoutMeetingUsersRequestSchema>;

/**
 * 管理等候室成员
 * @see https://developer.work.weixin.qq.com/document/path/99018
 */
export const ManageWaitingRoomUsersRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 操作类型。1：主持人将等候室成员移入会议；2：主持人将会中成员移入等候室；3：主持人将等候室成员移出等候室 (1-主持人将等候室成员移入会议, 2-主持人将会中成员移入等候室, 3-主持人将等候室成员移出等候室) */
  operate_type: z.number(),
  /** 移出成员后是否允许其再次加入会议（该字段对 MRA 设备不生效）：true：允许；false：不允许。说明：operate_type=3时才允许设置 */
  allow_rejoin: z.boolean().optional(),
  /** 被操作成员列表，详见User */
  operated_users: z.array(z.object({ tmp_openid: z.string(), instance_id: z.number() })),
});
export type ManageWaitingRoomUsersRequest = z.infer<typeof ManageWaitingRoomUsersRequestSchema>;

/**
 * 静音成员
 * @see https://developer.work.weixin.qq.com/document/path/99025
 */
export const MuteMeetingUserRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** true：静音；false：解除静音 (true-静音, false-解除静音) */
  option: z.boolean(),
  /** 被操作对象列表 */
  operated_user: z.array(z.object({ tmp_openid: z.string(), instance_id: z.number() })),
});
export type MuteMeetingUserRequest = z.infer<typeof MuteMeetingUserRequestSchema>;

/**
 * 管理会中设置
 * @see https://developer.work.weixin.qq.com/document/path/99016
 */
export const SetMeetingConfigRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 是否全体静音：true为全体静音，false为关闭全体静音 */
  mute_all: z.boolean().optional(),
  /** 是否允许成员自己取消静音。请求参数 mute_all 必传，且 mute_all = true 时设置才生效。true为允许，false为不允许 */
  allow_unmute_self: z.boolean().optional(),
  /** 成员入会静音：0为关闭静音，1为开启静音，2为超过6人自动开启静音 (0-关闭静音, 1-开启静音, 2-超过6人自动开启静音) */
  enable_enter_mute: z.number().optional(),
  /** 是否锁定会议：true为锁定，false为关闭锁定 */
  meeting_locked: z.boolean().optional(),
  /** 隐藏会议号和密码：true为隐藏，false为不隐藏 */
  hide_meeting_code_password: z.boolean().optional(),
  /** 允许参会者聊天设置：0为允许参会者自由聊天，1为仅允许参会者公开聊天，2为仅允许私聊主持人 (0-允许参会者自由聊天, 1-仅允许参会者公开聊天, 2-仅允许私聊主持人) */
  allow_chat: z.number().optional(),
  /** 是否允许参会者发起屏幕共享：true为允许，false为不允许 */
  allow_share_screen: z.boolean().optional(),
  /** 是否仅企业成员可入会：true为仅企业成员可入会，false为不限制 */
  allow_external_user: z.boolean().optional(),
  /** 成员入会是否播放提示音：true为成员入会播放提示音，false为不播放 */
  play_ivr_on_join: z.boolean().optional(),
  /** 是否开启等候室：true为开启，false为关闭 */
  enable_waiting_room: z.boolean().optional(),
});
export type SetMeetingConfigRequest = z.infer<typeof SetMeetingConfigRequestSchema>;

/**
 * 管理联席主持人
 * @see https://developer.work.weixin.qq.com/document/path/99017
 */
export const SetMeetingCohostRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 具体设置动作。true：设置联席主持人；false：撤销联席主持人 (true-设置联席主持人, false-撤销联席主持人) */
  action: z.boolean(),
  /** 被操作成员信息 */
  operated_user: z.object({ tmp_openid: z.string(), instance_id: z.number() }),
});
export type SetMeetingCohostRequest = z.infer<typeof SetMeetingCohostRequestSchema>;

/**
 * 修改成员在会中显示的昵称
 * @see https://developer.work.weixin.qq.com/document/path/99095
 */
export const SetMeetingNicknamesRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 被操作对象列表，详见User */
  operated_users: z.array(z.object({ tmp_openid: z.string(), instance_id: z.number(), nickname: z.string().min(1).max(20) })),
});
export type SetMeetingNicknamesRequest = z.infer<typeof SetMeetingNicknamesRequestSchema>;

/**
 * 关闭或开启成员视频
 * @see https://developer.work.weixin.qq.com/document/path/99026
 */
export const SwitchUserVideoRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string().min(1),
  /** 操作类型。false：关闭视频（默认值）。true：开启视频，仅支持MRA设备 (true-开启视频, false-关闭视频) */
  video: z.boolean().optional(),
  /** 被操作者 */
  operated_user: z.object({ tmp_openid: z.string().min(1), instance_id: z.number() }),
});
export type SwitchUserVideoRequest = z.infer<typeof SwitchUserVideoRequestSchema>;

/**
 * 删除会议录制
 * @see https://developer.work.weixin.qq.com/document/path/98206
 */
export const DeleteMeetingRecordRequestSchema = z.object({
  /** 会议录制ID */
  meeting_record_id: z.string(),
  /** 会议ID */
  meetingid: z.string(),
});
export type DeleteMeetingRecordRequest = z.infer<typeof DeleteMeetingRecordRequestSchema>;

/**
 * 删除单个录制文件
 * @see https://developer.work.weixin.qq.com/document/path/98207
 */
export const DeleteMeetingRecordFileRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 录制文件ID */
  record_file_id: z.string(),
});
export type DeleteMeetingRecordFileRequest = z.infer<typeof DeleteMeetingRecordFileRequestSchema>;

/**
 * 获取单个录制文件详情
 * @see https://developer.work.weixin.qq.com/document/path/100916
 */
export const GetRecordFileDetailRequestSchema = z.object({
  /** 会议录制ID */
  record_file_id: z.string(),
  /** 会议ID */
  meetingid: z.string(),
});
export type GetRecordFileDetailRequest = z.infer<typeof GetRecordFileDetailRequestSchema>;
export const GetRecordFileDetailResponseSchema = z.object({
  /** 会议ID */
  meetingid: z.string().optional(),
  /** 入会码 */
  meeting_code: z.string().optional(),
  /** 录制文件 ID */
  record_file_id: z.string().optional(),
  /** 播放地址 */
  view_address: z.string().optional(),
  /** 下载地址，默认6小时过期 */
  download_address: z.string().optional(),
  /** 下载视频文件格式，例如：mp4 */
  download_address_file_type: z.string().optional(),
  /** 音频下载地址，默认6小时过期 */
  audio_address: z.string().optional(),
  /** 下载音频文件格式，例如：m4a */
  audio_address_file_type: z.string().optional(),
  /** 录制文件名 */
  record_name: z.string().optional(),
  /** 录制开始时间 */
  start_time: z.number().optional(),
  /** 录制结束时间 */
  end_time: z.number().optional(),
  /** 会议录制名 */
  meeting_record_name: z.string().optional(),
  /** 会议纪要文件列表 */
  meeting_summary: z.array(z.object({ download_address: z.string(), file_type: z.string() })).optional(),
  /** 录制转写文件（智能优化版）列表 */
  ai_meeting_transcripts: z.array(z.object({ download_address: z.string(), file_type: z.string() })).optional(),
});
export type GetRecordFileDetailResponse = z.infer<typeof GetRecordFileDetailResponseSchema>;

/**
 * 获取会议录制地址
 * @see https://developer.work.weixin.qq.com/document/path/100917
 */
export const GetMeetingRecordFileListRequestSchema = z.object({
  /** 会议录制ID */
  meeting_record_id: z.string(),
  /** 会议ID */
  meetingid: z.string(),
});
export type GetMeetingRecordFileListRequest = z.infer<typeof GetMeetingRecordFileListRequestSchema>;
export const GetMeetingRecordFileListResponseSchema = z.object({
  /** 会议录制 ID */
  meeting_record_id: z.string().optional(),
  /** 会议 ID */
  meetingid: z.string().optional(),
  /** 会议 code */
  meeting_code: z.string().optional(),
  /** 会议主题 */
  title: z.string().optional(),
  /** 直播录制文件列表 */
  record_files: z.array(z.object({ record_file_id: z.string(), view_address: z.string(), download_address: z.string(), download_address_file_type: z.string(), audio_address: z.string(), audio_address_file_type: z.string(), meeting_summary: z.array(z.object({ download_address: z.string(), file_type: z.string() })) })).optional(),
});
export type GetMeetingRecordFileListResponse = z.infer<typeof GetMeetingRecordFileListResponseSchema>;

/**
 * 获取录制文件访问统计
 * @see https://developer.work.weixin.qq.com/document/path/99263
 */
export const ListMeetingRecordStatisticsRequestSchema = z.object({
  /** 会议录制ID */
  meeting_record_id: z.string().min(1),
  /** 会议ID */
  meetingid: z.string().min(1).optional(),
  /** 查询起始时间戳，UNIX 时间戳（单位秒）。默认展示最近31天的数据 [timestamp] */
  start_time: z.number().optional(),
  /** 查询结束时间戳，UNIX 时间戳（单位秒）。默认展示最近31天的数据 [timestamp] */
  end_time: z.number().optional(),
});
export type ListMeetingRecordStatisticsRequest = z.infer<typeof ListMeetingRecordStatisticsRequestSchema>;
export const ListMeetingRecordStatisticsResponseSchema = z.object({
  /** 统计结果列表 */
  summaries: z.array(z.object({ date: z.string().min(10).max(10), view_count: z.number().min(0).default(0), download_count: z.number().min(0).default(0) })).optional(),
});
export type ListMeetingRecordStatisticsResponse = z.infer<typeof ListMeetingRecordStatisticsResponseSchema>;

/**
 * 获取会议录制列表
 * @see https://developer.work.weixin.qq.com/document/path/99236
 */
export const ListMeetingRecordRequestSchema = z.object({
  /** 会议 ID，不为空时优先根据会议 ID 查询 */
  meetingid: z.string().optional(),
  /** 会议 code，当 meeting_id 为空且 meeting_code 不为空时根据会议 code 查询。当 meeting_id 和 meeting_co */
  meeting_code: z.string().optional(),
  /** 待查询成员的 userid。meetingid、meeting_code 和 userid 三者选填其中一项 */
  userid: z.string().optional(),
  /** 查询起始时间戳，UNIX 时间戳（单位秒）。查询时间区间跨度不允许超过31天 [timestamp] */
  start_time: z.number(),
  /** 查询结束时间戳，UNIX 时间戳（单位秒）。查询时间区间跨度不允许超过31天 [timestamp] */
  end_time: z.number(),
  /** 上一次调用时返回的 next_cursor，初次调用可不传 */
  cursor: z.string().optional(),
  /** 单次查询返回的最大数量限制，默认为 10，最大 20 */
  limit: z.number().max(20).default(10).optional(),
});
export type ListMeetingRecordRequest = z.infer<typeof ListMeetingRecordRequestSchema>;
export const ListMeetingRecordResponseSchema = z.object({
  /** 是否还有未拉取的会议录制列表 */
  has_more: z.boolean().optional(),
  /** 当 has_more=true 时有值，表示当前数据最后一个 key 值，用于分页拉取 */
  next_cursor: z.string().optional(),
  /** 会议录制列表 */
  record_list: z.array(z.object({ meeting_record_id: z.string(), meetingid: z.string(), meeting_code: z.string(), host_user_id: z.string(), meeting_start_time: z.number(), title: z.string(), state: z.number(), record_file_list: z.array(z.object({ record_file_id: z.string(), record_start_time: z.number(), record_end_time: z.number(), record_size: z.number(), sharing_state: z.number(), sharing_url: z.string(), required_same_corp: z.boolean(), required_attendee: z.boolean(), password: z.string(), sharing_expire: z.number(), allow_download: z.boolean() })) })).optional(),
});
export type ListMeetingRecordResponse = z.infer<typeof ListMeetingRecordResponseSchema>;

/**
 * 获取录制转写详情
 * @see https://developer.work.weixin.qq.com/document/path/100926
 */
export const GetTranscriptDetailRequestSchema = z.object({
  /** 录制文件 ID */
  record_file_id: z.string(),
  /** 会议 ID */
  meetingid: z.string(),
  /** 查询的起始段落 ID。获取 pid 后（含）的段落，默认从0开始 */
  pid: z.string().optional(),
  /** 查询的段落数，默认查询全量数据 */
  limit: z.number().optional(),
});
export type GetTranscriptDetailRequest = z.infer<typeof GetTranscriptDetailRequestSchema>;
export const GetTranscriptDetailResponseSchema = z.object({
  /** 如果传入 pid 或 limit 字段，且没有一次完全返回，则为 true；否则为 false */
  has_more: z.boolean().optional(),
  /** 录制转写详情 */
  transcripts: z.object({ paragraphs: z.array(z.object({ pid: z.string(), start_time: z.number(), end_time: z.number(), speaker_info: z.object({ userid: z.string() }), sentences: z.array(z.object({ sid: z.string(), start_time: z.number(), end_time: z.number(), words: z.array(z.object({ wid: z.string(), start_time: z.number(), end_time: z.number(), text: z.string() })) })) })), keywords: z.array(z.string()), audio_detect: z.number() }).optional(),
});
export type GetTranscriptDetailResponse = z.infer<typeof GetTranscriptDetailResponseSchema>;

/**
 * 获取录制转写段落信息
 * @see https://developer.work.weixin.qq.com/document/path/100925
 */
export const GetTranscriptParagraphListRequestSchema = z.object({
  /** 录制文件 ID */
  record_file_id: z.string(),
  /** 会议ID */
  meetingid: z.string(),
});
export type GetTranscriptParagraphListRequest = z.infer<typeof GetTranscriptParagraphListRequestSchema>;
export const GetTranscriptParagraphListResponseSchema = z.object({
  /** 声纹识别状态：0-未完成，1-已完成 (0-未完成, 1-已完成) */
  audio_detect: z.number().optional(),
  /** 段落列表 */
  paragraphs: z.array(z.object({ pid: z.string(), start_time: z.number(), end_time: z.number() })).optional(),
});
export type GetTranscriptParagraphListResponse = z.infer<typeof GetTranscriptParagraphListResponseSchema>;

/**
 * 获取录制转写搜索结果
 * @see https://developer.work.weixin.qq.com/document/path/100927
 */
export const SearchTranscriptRequestSchema = z.object({
  /** 会议录制文件ID */
  record_file_id: z.string(),
  /** 会议ID */
  meetingid: z.string(),
  /** 搜索的文本 */
  text: z.string(),
});
export type SearchTranscriptRequest = z.infer<typeof SearchTranscriptRequestSchema>;
export const SearchTranscriptResponseSchema = z.object({
  /** 搜索结果列表，详见Result */
  hits: z.array(z.object({ pid: z.string(), sid: z.string(), offset: z.number(), length: z.number() })).optional(),
  /** 搜索结果时间戳对象列表，详见TimeLine。可用于时间轴上的预览 */
  timelines: z.array(z.object({ pid: z.string(), sid: z.string(), start_time: z.number() })).optional(),
});
export type SearchTranscriptResponse = z.infer<typeof SearchTranscriptResponseSchema>;

/**
 * 修改会议录制共享设置
 * @see https://developer.work.weixin.qq.com/document/path/98208
 */
export const UpdateMeetingRecordSharingConfigRequestSchema = z.object({
  /** 会议录制ID */
  meeting_record_id: z.string(),
  /** 会议ID */
  meetingid: z.string(),
  /** 共享配置 */
  sharing_config: z.object({ enable_sharing: z.boolean().default(true), sharing_auth_type: z.number(), enable_password: z.boolean().default(true), password: z.string(), enable_sharing_expire: z.boolean().default(false), sharing_expire: z.number(), allow_download: z.boolean().default(false) }).optional(),
});
export type UpdateMeetingRecordSharingConfigRequest = z.infer<typeof UpdateMeetingRecordSharingConfigRequestSchema>;

/**
 * 预定Rooms会议室
 * @see https://developer.work.weixin.qq.com/document/path/99273
 */
export const BookMeetingRoomsRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** Rooms会议室 ID 列表 */
  meeting_room_id_list: z.array(z.string()),
  /** 在会议开始前的一小时内，是否在 Room 上显示会议主题。true：显示，false：不显示。该参数并不影响预定时间晚过当前时间一个小时以上的会议。 (true-显示, false-不显示) */
  subject_visible: z.boolean().optional(),
});
export type BookMeetingRoomsRequest = z.infer<typeof BookMeetingRoomsRequestSchema>;
export const BookMeetingRoomsResponseSchema = z.object({
  /** Rooms会议室对象列表 */
  meeting_room_list: z.array(z.object({ meeting_room_id: z.string(), meeting_room_name: z.string(), meeting_room_location: z.string() })).optional(),
});
export type BookMeetingRoomsResponse = z.infer<typeof BookMeetingRoomsResponseSchema>;

/**
 * 呼叫Rooms会议室
 * @see https://developer.work.weixin.qq.com/document/path/99276
 */
export const CallMeetingRoomRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** Rooms会议室ID，与mra_address二选一 */
  meeting_room_id: z.string().optional(),
  /** MRA对象，与meeting_room_id二选一 */
  mra_address: z.object({ protocol: z.number(), dial_string: z.string() }).optional(),
});
export type CallMeetingRoomRequest = z.infer<typeof CallMeetingRoomRequestSchema>;
export const CallMeetingRoomResponseSchema = z.object({
  /** 呼叫ID */
  invite_id: z.string().optional(),
});
export type CallMeetingRoomResponse = z.infer<typeof CallMeetingRoomResponseSchema>;

/**
 * 取消呼叫Rooms会议室
 * @see https://developer.work.weixin.qq.com/document/path/99275
 */
export const CancelRoomCallRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** 呼叫 ID */
  invite_id: z.string(),
  /** Rooms会议室 ID，与 mra_address 二选一 */
  meeting_room_id: z.string().optional(),
  /** MRA 对象，与 meeting_room_id 二选一 */
  mra_address: z.object({ protocol: z.number(), dial_string: z.string() }).optional(),
});
export type CancelRoomCallRequest = z.infer<typeof CancelRoomCallRequestSchema>;

/**
 * 获取Rooms会议室配置项
 * @see https://developer.work.weixin.qq.com/document/path/99277
 */
export const GetMeetingRoomConfigRequestSchema = z.object({
  /** Rooms会议室ID */
  meeting_room_id: z.string().min(1),
});
export type GetMeetingRoomConfigRequest = z.infer<typeof GetMeetingRoomConfigRequestSchema>;
export const GetMeetingRoomConfigResponseSchema = z.object({
  /** Rooms会议室会议配置对象 */
  meeting_settings: z.object({ water_mark: z.number(), auto_response: z.number(), caption: z.boolean(), room_pmi: z.boolean(), room_notification: z.boolean() }).optional(),
  /** Rooms会议室录制配置对象 */
  record_settings: z.object({ share_record: z.number(), download_record: z.boolean() }).optional(),
});
export type GetMeetingRoomConfigResponse = z.infer<typeof GetMeetingRoomConfigResponseSchema>;

/**
 * 获取Rooms会议室详情
 * @see https://developer.work.weixin.qq.com/document/path/99279
 */
export const GetRoomInfoRequestSchema = z.object({
  /** Rooms会议室ID */
  meeting_room_id: z.string(),
});
export type GetRoomInfoRequest = z.infer<typeof GetRoomInfoRequestSchema>;
export const GetRoomInfoResponseSchema = z.object({
  /** Rooms会议室基本信息 */
  basic_info: z.object({ rooms_id_list: z.array(z.string()), meeting_room_name: z.string(), city: z.string(), building: z.string(), floor: z.string(), participant_number: z.number(), device: z.string(), desc: z.string(), password: z.string() }).optional(),
  /** Rooms会议室账号信息 */
  account_info: z.object({ account_type: z.number(), valid_period: z.string() }).optional(),
  /** Rooms会议室硬件信息 */
  hardware_info: z.object({ factory: z.string(), device_model: z.string(), sn: z.string(), ip: z.string(), mac: z.string(), rooms_version: z.string(), firmware_version: z.string(), health_status: z.string(), system_type: z.string(), meeting_room_status: z.number(), active_time: z.string(), cpu_info: z.string(), cpu_usage: z.string(), gpu_info: z.string(), net_type: z.string(), memory_info: z.string(), monitor_frequency: z.number(), camera_model: z.string(), enable_video_mirror: z.boolean(), microphone_info: z.string(), speaker_info: z.string() }).optional(),
  /** Rooms会议室PMI信息 */
  pmi_info: z.object({ pmi_code: z.string(), pmi_pwd: z.string() }).optional(),
  /** 告警通知状态：0-未开启，1-已开启 (0-未开启, 1-已开启) */
  monitor_status: z.number().optional(),
  /** 是否允许被呼叫：true-是，false-否 (true-是, false-否) */
  is_allow_call: z.boolean().optional(),
  /** 预定状态：0-未开放预定，1-开放预定 (0-未开放预定, 1-开放预定) */
  scheduled_status: z.number().optional(),
});
export type GetRoomInfoResponse = z.infer<typeof GetRoomInfoResponseSchema>;

export const GetMeetingRoomInventoryResponseSchema = z.object({
  /** 普通设备数 */
  normal_count: z.number().optional(),
  /** 专款设备数 */
  special_count: z.number().optional(),
  /** 普通设备使用数 */
  normal_used_count: z.number().optional(),
  /** 专款设备使用数 */
  special_used_count: z.number().optional(),
  /** 普通设备过期数 */
  normal_expired_count: z.number().optional(),
  /** 专款设备过期数 */
  special_expired_count: z.number().optional(),
});
export type GetMeetingRoomInventoryResponse = z.infer<typeof GetMeetingRoomInventoryResponseSchema>;

/**
 * 获取Rooms会议室应答状态
 * @see https://developer.work.weixin.qq.com/document/path/99274
 */
export const GetRoomResponseStatusRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** Rooms会议室 ID，与 mra_address 二选一 */
  meeting_room_id: z.string().optional(),
  /** MRA 对象，与 meeting_room_id 二选一 */
  mra_address: z.object({ protocol: z.number(), dial_string: z.string() }).optional(),
});
export type GetRoomResponseStatusRequest = z.infer<typeof GetRoomResponseStatusRequestSchema>;
export const GetRoomResponseStatusResponseSchema = z.object({
  /** 应答状态：0：无应答，60秒无回应；1：未呼叫；2：入会中；3：被拒绝；4：呼叫中；5：取消呼叫（仅 Rooms会议室有该状态）；6：已离会 (0-无应答, 1-未呼叫, 2-入会中, 3-被拒绝, 4-呼叫中, 5-取消呼叫, 6-已离会 */
  status: z.number().optional(),
  /** 最近一次应答时间 */
  response_time: z.string().optional(),
});
export type GetRoomResponseStatusResponse = z.infer<typeof GetRoomResponseStatusResponseSchema>;

/**
 * 获取Rooms会议室列表
 * @see https://developer.work.weixin.qq.com/document/path/99280
 */
export const ListMeetingRoomRequestSchema = z.object({
  /** Rooms会议室名称（支持模糊匹配查找） */
  meeting_room_name: z.string().optional(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值 */
  cursor: z.string().optional(),
  /** 分页大小，从1开始，最大50，默认20 */
  limit: z.number().min(1).max(50).default(20).optional(),
});
export type ListMeetingRoomRequest = z.infer<typeof ListMeetingRoomRequestSchema>;
export const ListMeetingRoomResponseSchema = z.object({
  /** 是否还有更多Rooms会议室列表 */
  has_more: z.boolean().optional(),
  /** 分页用，has_more为true时，下一次拉取列表将该字段填入cursor字段 */
  next_cursor: z.string().optional(),
  /** Rooms会议室对象列表，详见MeetingRoom */
  meeting_room_list: z.array(z.object({ meeting_room_id: z.string(), meeting_room_name: z.string(), meeting_room_location: z.string(), account_type: z.number(), active_code: z.string(), participant_number: z.number(), meeting_room_status: z.number(), scheduled_status: z.number(), is_allow_call: z.boolean() })).optional(),
});
export type ListMeetingRoomResponse = z.infer<typeof ListMeetingRoomResponseSchema>;

/**
 * 获取控制器列表
 * @see https://developer.work.weixin.qq.com/document/path/99231
 */
export const ListMeetingRoomControllersRequestSchema = z.object({
  /** 需要获取的控制器名称（支持模糊匹配查找） */
  controller_name: z.string().optional(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值 */
  cursor: z.string().optional(),
  /** 分页大小，从1开始，最大50，默认20 */
  limit: z.number().min(1).max(50).default(20).optional(),
});
export type ListMeetingRoomControllersRequest = z.infer<typeof ListMeetingRoomControllersRequestSchema>;
export const ListMeetingRoomControllersResponseSchema = z.object({
  /** 是否还有更多Rooms会议室列表 */
  has_more: z.boolean().optional(),
  /** 分页用，has_more为true时，下一次拉取列表将该字段填入cursor字段 */
  next_cursor: z.string().optional(),
  /** Rooms会议室对象列表，详见ControllerInfo */
  controller_info_list: z.array(z.object({ rooms_id: z.string(), meeting_room_name: z.string(), meeting_room_location: z.string(), controller_name: z.string(), manufacture_name: z.string(), controller_model: z.string(), app_version: z.string(), status: z.string(), framework_version: z.string(), ip_address: z.string(), mac_address: z.string(), cpu_type: z.string(), cpu_usage: z.string(), network_type: z.string(), mem_usage: z.string() })).optional(),
});
export type ListMeetingRoomControllersResponse = z.infer<typeof ListMeetingRoomControllersResponseSchema>;

/**
 * 获取设备列表
 * @see https://developer.work.weixin.qq.com/document/path/99230
 */
export const ListMeetingRoomDevicesRequestSchema = z.object({
  /** Rooms会议室名称（支持模糊匹配查找） */
  meeting_room_name: z.string().optional(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值 */
  cursor: z.string().optional(),
  /** 分页大小，从1开始，最大50，默认20 */
  limit: z.number().min(1).max(50).default(20).optional(),
});
export type ListMeetingRoomDevicesRequest = z.infer<typeof ListMeetingRoomDevicesRequestSchema>;
export const ListMeetingRoomDevicesResponseSchema = z.object({
  /** 是否还有更多Rooms会议室列表 */
  has_more: z.boolean().optional(),
  /** 分页用，has_more为true时，下一次拉取列表将该字段填入cursor字段 */
  next_cursor: z.string().optional(),
  /** 设备信息对象列表，详见DeviceInfo */
  device_info_list: z.array(z.object({ meeting_room_id: z.string(), rooms_id: z.string(), meeting_room_name: z.string(), meeting_room_location: z.string(), device_model: z.string(), app_version: z.string(), meeting_room_status: z.number(), device_monitor_info: z.object({ camera_status: z.boolean(), microphone_status: z.boolean(), speaker_status: z.boolean() }) })).optional(),
});
export type ListMeetingRoomDevicesResponse = z.infer<typeof ListMeetingRoomDevicesResponseSchema>;

/**
 * 获取Rooms会议室下的会议列表
 * @see https://developer.work.weixin.qq.com/document/path/99278
 */
export const ListRoomMeetingsRequestSchema = z.object({
  /** Rooms会议室 ID，与rooms_id二者填其一。 */
  meeting_room_id: z.string().optional(),
  /** rooms 设备 rooms_id。与meeting_room_id二者填其一。 */
  rooms_id: z.string().optional(),
  /** Unix 时间戳。查询起始时间，时间区间不超过90天 [timestamp] */
  start_time: z.number().optional(),
  /** Unix 时间戳。查询结束时间，时间区间不超过90天 [timestamp] */
  end_time: z.number().optional(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值 */
  cursor: z.string().optional(),
  /** 分页大小，默认20条，最大20条 */
  limit: z.number().min(1).max(20).default(20).optional(),
});
export type ListRoomMeetingsRequest = z.infer<typeof ListRoomMeetingsRequestSchema>;
export const ListRoomMeetingsResponseSchema = z.object({
  /** 是否还有更多Rooms会议室列表 */
  has_more: z.boolean().optional(),
  /** 分页用，has_more为true时，下一次拉取列表将该字段填入cursor字段 */
  next_cursor: z.string().optional(),
  /** 会议对象列表，详见MeetingInfo */
  meeting_info_list: z.array(z.object({ meetingid: z.string(), meeting_code: z.string(), subject: z.string(), status: z.string(), meeting_type: z.number(), start_time: z.number(), end_time: z.number() })).optional(),
});
export type ListRoomMeetingsResponse = z.infer<typeof ListRoomMeetingsResponseSchema>;

/**
 * 释放Rooms会议室
 * @see https://developer.work.weixin.qq.com/document/path/99281
 */
export const ReleaseMeetingRoomsRequestSchema = z.object({
  /** 会议 ID */
  meetingid: z.string(),
  /** Rooms 会议室 ID 列表 */
  meeting_room_id_list: z.array(z.string()),
});
export type ReleaseMeetingRoomsRequest = z.infer<typeof ReleaseMeetingRoomsRequestSchema>;

/**
 * 更新会议嘉宾列表
 * @see https://developer.work.weixin.qq.com/document/path/99042
 */
export const SetMeetingGuestsRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 会议嘉宾列表 */
  guests: z.array(z.object({ area: z.string(), phone_number: z.string(), guest_name: z.string().max(16) })),
});
export type SetMeetingGuestsRequest = z.infer<typeof SetMeetingGuestsRequestSchema>;

/**
 * 更新会议受邀成员列表
 * @see https://developer.work.weixin.qq.com/document/path/98997
 */
export const SetMeetingInviteesRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 受邀成员列表。最大支持2000人。与企业所购在线会议室最大方数相关。 */
  invitees: z.array(z.object({ userid: z.string() })).optional(),
});
export type SetMeetingInviteesRequest = z.infer<typeof SetMeetingInviteesRequestSchema>;

/**
 * 获取会议发起记录
 * @see https://developer.work.weixin.qq.com/document/path/99651
 */
export const ListMeetingStartRequestSchema = z.object({
  /** 查询类型。1:发起成功的会议记录; 2:发起失败的会议（企业同时发起的会议数已达上限，员工无法发起） (1-发起成功的会议记录, 2-发起失败的会议) */
  type: z.number(),
  /** 查询范围起始时间戳，单位为秒 [timestamp] */
  begin_time: z.number(),
  /** 查询范围结束时间戳，单位为秒 [timestamp] */
  end_time: z.number(),
  /** 每次拉取的数据量，默认值200，最大值1000 */
  limit: z.number().min(1).max(1000).default(200).optional(),
  /** 用于分页查询的游标，由上一次调用返回，首次调用可不填 */
  cursor: z.string().optional(),
});
export type ListMeetingStartRequest = z.infer<typeof ListMeetingStartRequestSchema>;
export const ListMeetingStartResponseSchema = z.object({
  /** 当前数据最后一个key值，如果下次调用带上该值则从该key值往后拉，用于实现分页拉取 */
  next_cursor: z.string().optional(),
  /** 是否还有数据待拉取 */
  has_more: z.boolean().optional(),
  /** 发起会议成功或失败的记录信息，取决于请求中的type参数 */
  meeting_list: z.array(z.object({ userid: z.string(), start_time: z.number() })).optional(),
});
export type ListMeetingStartResponse = z.infer<typeof ListMeetingStartResponseSchema>;

/**
 * 修改预约会议
 * @see https://developer.work.weixin.qq.com/document/path/99047
 */
export const UpdateMeetingRequestSchema = z.object({
  /** 会议id，仅允许修改预约状态下的会议 */
  meetingid: z.string(),
  /** 会议的标题，最多支持40个字节或者20个utf8字符 */
  title: z.string().max(40).optional(),
  /** 会议开始时间的unix时间戳。需大于当前时间。注：修改该字段时必须同时指定meeting_duration [timestamp] */
  meeting_start: z.number().optional(),
  /** 会议持续时间（单位秒），最小300秒，最大86399秒。注：修改该字段时，必须同时指定meeting_start */
  meeting_duration: z.number().min(300).max(86399).optional(),
  /** 会议的描述，最多支持500个字节或者utf8字符 */
  description: z.string().max(500).optional(),
  /** 会议地点，最多128个字符 */
  location: z.string().max(128).optional(),
  /** 指定会议开始前多久提醒成员，相对于meeting_start前的秒数，默认为0 */
  remind_time: z.number().min(0).default(0).optional(),
  /** 邀请参会的成员。普通企业参会人员最多为100人；付费企业不超过企业选购的在线会议室容量，但最多为300人 */
  invitees: z.object({ userid: z.array(z.string()) }).optional(),
  /** 会议所属日历ID。第三方应用必须指定。不多于64字节 */
  cal_id: z.string().max(64).optional(),
  /** 会议配置 */
  settings: z.object({ password: z.string().min(4).max(6), enable_waiting_room: z.boolean().default(false), allow_enter_before_host: z.boolean().default(true), remind_scope: z.number(), enable_enter_mute: z.number(), enable_screen_watermark: z.boolean().default(false), hosts: z.object({ userid: z.array(z.string()) }), ring_users: z.object({ userid: z.array(z.string()) }) }).optional(),
  /** 重复会议相关配置 */
  reminders: z.object({ is_repeat: z.number(), repeat_type: z.number(), repeat_until: z.number(), repeat_interval: z.number().max(2), remind_before: z.number() }).optional(),
});
export type UpdateMeetingRequest = z.infer<typeof UpdateMeetingRequestSchema>;
export const UpdateMeetingResponseSchema = z.object({
  /** 参会人中包含无效会议账号的userid，仅在购买会议专业版企业由于部分参会人无有效会议账号时返回 */
  excess_users: z.array(z.string()).optional(),
});
export type UpdateMeetingResponse = z.infer<typeof UpdateMeetingResponseSchema>;

/**
 * 获取高级功能账号列表
 * @see https://developer.work.weixin.qq.com/document/path/99510
 */
export const ListMeetingVipRequestSchema = z.object({
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().optional(),
  /** 用于分页查询，每次请求返回的数据上限。默认100，最大200 */
  limit: z.number().max(200).default(100).optional(),
});
export type ListMeetingVipRequest = z.infer<typeof ListMeetingVipRequestSchema>;
export const ListMeetingVipResponseSchema = z.object({
  /** 是否还有更多数据未获取 */
  has_more: z.boolean().optional(),
  /** 下一次请求的cursor值 */
  next_cursor: z.string().optional(),
  /** 符合条件的企业成员userid列表 */
  userid_list: z.array(z.string()).optional(),
});
export type ListMeetingVipResponse = z.infer<typeof ListMeetingVipResponseSchema>;

/**
 * 分配高级功能账号
 * @see https://developer.work.weixin.qq.com/document/path/99508
 */
export const BatchAddMeetingVipRequestSchema = z.object({
  /** 要分配高级功能的企业成员userid列表，单次操作最大限制100个 */
  userid_list: z.array(z.string()),
});
export type BatchAddMeetingVipRequest = z.infer<typeof BatchAddMeetingVipRequestSchema>;
export const BatchAddMeetingVipResponseSchema = z.object({
  /** 批量分配高级功能的任务id */
  jobid: z.string().optional(),
  /** 非法的userid 列表，不在应用可见范围的userid以及无法识别的userid */
  invalid_userid_list: z.array(z.string()).optional(),
});
export type BatchAddMeetingVipResponse = z.infer<typeof BatchAddMeetingVipResponseSchema>;

/**
 * 取消高级功能账号
 * @see https://developer.work.weixin.qq.com/document/path/99509
 */
export const BatchDeleteMeetingVipJobRequestSchema = z.object({
  /** 要撤销分配高级功能的企业成员userid列表 */
  userid_list: z.array(z.string()),
});
export type BatchDeleteMeetingVipJobRequest = z.infer<typeof BatchDeleteMeetingVipJobRequestSchema>;
export const BatchDeleteMeetingVipJobResponseSchema = z.object({
  /** 批量取消高级功能的任务id */
  jobid: z.string().optional(),
  /** 非法的userid列表，不在应用可见范围的useri以及无法识别的userid */
  invalid_userid_list: z.array(z.string()).optional(),
});
export type BatchDeleteMeetingVipJobResponse = z.infer<typeof BatchDeleteMeetingVipJobResponseSchema>;

/**
 * 获取实时等候室成员列表
 * @see https://developer.work.weixin.qq.com/document/path/98163
 */
export const ListMeetingWaitingRoomUserRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 分页大小，默认10，最大50 */
  limit: z.number().min(1).max(50).default(10).optional(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值 */
  cursor: z.string().optional(),
});
export type ListMeetingWaitingRoomUserRequest = z.infer<typeof ListMeetingWaitingRoomUserRequestSchema>;
export const ListMeetingWaitingRoomUserResponseSchema = z.object({
  /** 是否还有未拉取的成员列表 */
  has_more: z.boolean().optional(),
  /** 当has_more=true时有值，下次请求将该字段赋值给cursor字段 */
  next_cursor: z.string().optional(),
  /** 等候室人员对象数组。详见User */
  user_list: z.array(z.object({ userid: z.string(), instance_id: z.number(), customer_data: z.string(), tmp_openid: z.string() })).optional(),
});
export type ListMeetingWaitingRoomUserResponse = z.infer<typeof ListMeetingWaitingRoomUserResponseSchema>;

/**
 * 获取等候室成员记录
 * @see https://developer.work.weixin.qq.com/document/path/99065
 */
export const ListWaitingRoomUserRequestSchema = z.object({
  /** 会议ID */
  meetingid: z.string(),
  /** 分页大小，默认20，最大50 */
  limit: z.number().min(1).max(50).default(20).optional(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值 */
  cursor: z.string().optional(),
});
export type ListWaitingRoomUserRequest = z.infer<typeof ListWaitingRoomUserRequestSchema>;
export const ListWaitingRoomUserResponseSchema = z.object({
  /** 是否还有更多成员列表 */
  has_more: z.boolean().optional(),
  /** 当has_more=true时有值，下次请求将该字段赋值给cursor字段 */
  next_cursor: z.string().optional(),
  /** 成员列表 */
  user_list: z.array(z.object({ userid: z.string(), tmp_openid: z.string(), instance_id: z.number(), join_time: z.number(), quit_time: z.number() })).optional(),
});
export type ListWaitingRoomUserResponse = z.infer<typeof ListWaitingRoomUserResponseSchema>;

/**
 * 取消网络研讨会
 * @see https://developer.work.weixin.qq.com/document/path/98870
 */
export const CancelWebinarRequestSchema = z.object({
  /** 网络研讨会ID */
  meetingid: z.string(),
});
export type CancelWebinarRequest = z.infer<typeof CancelWebinarRequestSchema>;

/**
 * 创建网络研讨会
 * @see https://developer.work.weixin.qq.com/document/path/98842
 */
export const CreateWebinarRequestSchema = z.object({
  /** 网络研讨会管理员userid */
  admin_userid: z.string().min(1),
  /** 网络研讨会主题 */
  title: z.string().min(1).max(255),
  /** 主办方名称 */
  sponsor: z.string().min(1).max(40).optional(),
  /** 会议开始时间戳（单位秒），不能少于当前时间戳半小时以上 [timestamp] */
  start_time: z.string().min(10),
  /** 会议结束时间戳（单位秒） [timestamp] */
  end_time: z.string().min(10),
  /** 观众观看限制类型 (0-公开, 1-报名, 2-密码) */
  admission_type: z.number(),
  /** 主持人的成员 ID，默认为网络研讨会管理员admin_userid。修改时传入会覆盖原有设置 */
  hosts: z.array(z.object({ userid: z.string().min(1) })).optional(),
  /** 观众观看密码（4~6位数字），当admission_type=2时必传，且仅当admission_type=2时才生效 */
  password: z.string().min(4).max(6).optional(),
  /** 封面图片 URL，图片仅支持PNG和JPEG格式，分辨率需大于640*360，推荐使用1280*720的高清图片，文件需控制在5MB以内。该参数需要开启活动页配 */
  cover_url: z.string().min(1).optional(),
  /** 网络研讨会描述详情，仅支持纯文本 */
  description: z.string().min(1).max(5000).optional(),
  /** 是否开启通过邀请链接自动成为嘉宾 (true-开启, false-不开启) */
  enable_guest_invite_link: z.boolean().optional(),
  /** 媒体参数配置 */
  media_setting: z.object({ enable_enter_mute: z.boolean(), allow_unmute_self: z.boolean(), allow_enter_before_host: z.boolean(), enable_screen_watermark: z.boolean(), watermark_type: z.number(), allow_external_user: z.boolean(), auto_record_type: z.string(), attendee_join_auto_record: z.boolean(), enable_host_pause_auto_record: z.boolean() }).optional(),
  /** 是否开启问答 (true-开启, false-不开启) */
  enable_qa: z.boolean().optional(),
  /** 聊天敏感词，最多可添加50个敏感词，单个敏感词限制10个中文字符长度 */
  sensitive_words: z.array(z.string()).optional(),
  /** 是否开启人工审核 (true-开启, false-不开启) */
  enable_manual_check: z.boolean().optional(),
  /** 活动页开启配置 (true-开启活动页, false-不开启活动页) */
  activity_page: z.boolean().optional(),
  /** 活动页展示已报名或已预约人数 (0-不展示, 1-展示) */
  display_number_of_attendees: z.number().optional(),
  /** 允许观众观看回放。开启本选项时必须开启云录制，即auto_record_type的值必须为cloud (true-允许, false-不允许) */
  playback_for_audience: z.boolean(),
  /** 是否开启准备模式 (true-开启, false-关闭) */
  preparation_mode: z.boolean().optional(),
});
export type CreateWebinarRequest = z.infer<typeof CreateWebinarRequestSchema>;
export const CreateWebinarResponseSchema = z.object({
  /** 网络研讨会主题 */
  title: z.string().optional(),
  /** 网络研讨会ID */
  meetingid: z.string().optional(),
  /** 网络研讨会的会议号 */
  meeting_code: z.string().optional(),
  /** 会议开始时间戳（单位秒） [timestamp] */
  start_time: z.string().min(10).optional(),
  /** 会议结束时间戳（单位秒） [timestamp] */
  end_time: z.string().min(10).optional(),
  /** 观众观看限制类型 (0-公开, 1-报名, 2-密码) */
  admission_type: z.number().optional(),
  /** 观众观看密码（4~6位数字） */
  password: z.string().min(4).max(6).optional(),
  /** 观众入会链接 */
  audience_join_link: z.string().min(1).optional(),
  /** 嘉宾入会链接 */
  guest_join_link: z.string().min(1).optional(),
  /** 人工审核链接。enable_manual_check开启后返回该字段 */
  manual_check_link: z.string().min(1).optional(),
  /** 人工审核密码。enable_manual_check开启后返回该字段 */
  manual_check_password: z.string().min(4).max(6).optional(),
});
export type CreateWebinarResponse = z.infer<typeof CreateWebinarResponseSchema>;

/**
 * 审批网络研讨会报名信息
 * @see https://developer.work.weixin.qq.com/document/path/98877
 */
export const ApproveWebinarEnrollRequestSchema = z.object({
  /** 网络研讨会 ID */
  meetingid: z.string(),
  /** 报名 ID 列表 */
  enroll_id_list: z.array(z.string()),
  /** 审批动作：1：取消批准，2：拒绝，3：批准。取消批准后状态将变成待审批。 (1-取消批准, 2-拒绝, 3-批准) */
  action: z.number(),
});
export type ApproveWebinarEnrollRequest = z.infer<typeof ApproveWebinarEnrollRequestSchema>;
export const ApproveWebinarEnrollResponseSchema = z.object({
  /** 成功处理的数量 */
  handled_count: z.number().optional(),
});
export type ApproveWebinarEnrollResponse = z.infer<typeof ApproveWebinarEnrollResponseSchema>;

/**
 * 删除网络研讨会报名信息
 * @see https://developer.work.weixin.qq.com/document/path/98881
 */
export const DeleteWebinarEnrollRequestSchema = z.object({
  /** 网络研讨会ID */
  meetingid: z.string(),
  /** 报名ID列表 */
  enroll_id_list: z.array(z.object({ enroll_id: z.string() })),
});
export type DeleteWebinarEnrollRequest = z.infer<typeof DeleteWebinarEnrollRequestSchema>;
export const DeleteWebinarEnrollResponseSchema = z.object({
  /** 成功删除的报名信息数量 */
  total_count: z.number().optional(),
});
export type DeleteWebinarEnrollResponse = z.infer<typeof DeleteWebinarEnrollResponseSchema>;

/**
 * 获取网络研讨会报名配置
 * @see https://developer.work.weixin.qq.com/document/path/99297
 */
export const GetWebinarEnrollConfigRequestSchema = z.object({
  /** 网络研讨会ID */
  meetingid: z.string(),
});
export type GetWebinarEnrollConfigRequest = z.infer<typeof GetWebinarEnrollConfigRequestSchema>;
export const GetWebinarEnrollConfigResponseSchema = z.object({
  /** 审批类型：1：自动审批，默认自动审批；2：手动审批 (1-自动审批, 2-手动审批) */
  approve_type: z.number().optional(),
  /** 是否收集问题：1：不收集，默认值为不收集；2：收集 (1-不收集, 2-收集) */
  is_collect_question: z.number().optional(),
  /** 本企业成员无需报名：true：本企业成员无需报名；false：默认配置，本企业成员及企业外成员需要报名 */
  no_registration_needed_for_staff: z.boolean().default(false).optional(),
  /** 报名问题列表，详见Question */
  question_list: z.array(z.object({ is_required: z.number(), question_title: z.string().max(40), question_type: z.number(), special_type: z.number(), option_list: z.array(z.object({ content: z.string().max(40) })) })).optional(),
});
export type GetWebinarEnrollConfigResponse = z.infer<typeof GetWebinarEnrollConfigResponseSchema>;

/**
 * 导入网络研讨会报名信息
 * @see https://developer.work.weixin.qq.com/document/path/98880
 */
export const ImportWebinarEnrollRequestSchema = z.object({
  /** 网络研讨会ID */
  meetingid: z.string(),
  /** 报名成员列表。详见EnrollRequest。 */
  enroll_list: z.array(z.object({ userid: z.string(), area: z.string(), phone_number: z.string(), nick_name: z.string() })),
});
export type ImportWebinarEnrollRequest = z.infer<typeof ImportWebinarEnrollRequestSchema>;
export const ImportWebinarEnrollResponseSchema = z.object({
  /** 成功导入的报名信息条数 */
  total_count: z.number().optional(),
  /** 报名成员列表。详见EnrollResponse。 */
  enroll_list: z.array(z.object({ enroll_id: z.string(), userid: z.string(), area: z.string(), phone_number: z.string(), nick_name: z.string(), enroll_code: z.string() })).optional(),
});
export type ImportWebinarEnrollResponse = z.infer<typeof ImportWebinarEnrollResponseSchema>;

/**
 * 获取网络研讨会报名信息
 * @see https://developer.work.weixin.qq.com/document/path/99023
 */
export const ListWebinarEnrollRequestSchema = z.object({
  /** 网络研讨会 ID */
  meetingid: z.string().min(1),
  /** 审批状态筛选字段，默认返回全部。0：全部。1：待审批。2：已拒绝。3：已批准。 (0-全部, 1-待审批, 2-已拒绝, 3-已批准) */
  status: z.number().optional(),
  /** 分页查询用，将上一个请求返回的next_cursor字段传入。第一次查询时可不传值 */
  cursor: z.string().min(0).optional(),
  /** 分页大小，最大50条。默认值为50 */
  limit: z.number().min(1).max(50).default(50).optional(),
});
export type ListWebinarEnrollRequest = z.infer<typeof ListWebinarEnrollRequestSchema>;
export const ListWebinarEnrollResponseSchema = z.object({
  /** 是否还有待拉取的成员列表 */
  has_more: z.boolean().optional(),
  /** 分页用，下一次拉取列表将该字段填入cursor字段 */
  next_cursor: z.string().optional(),
  /** 当前页的报名列表 */
  enroll_list: z.array(z.object({ enroll_id: z.string(), enroll_time: z.string(), enroll_source_type: z.number(), nick_name: z.string(), status: z.number(), userid: z.string(), tmp_openid: z.string(), enroll_code: z.string(), answer_list: z.array(z.object({ answer_content: z.array(z.string()), is_required: z.number(), question_num: z.number().min(1), question_title: z.string().min(1), question_type: z.number(), special_type: z.number() })) })).optional(),
});
export type ListWebinarEnrollResponse = z.infer<typeof ListWebinarEnrollResponseSchema>;

/**
 * 获取网络研讨会成员报名 ID
 * @see https://developer.work.weixin.qq.com/document/path/99021
 */
export const QueryWebinarEnrollIdByTmpOpenidRequestSchema = z.object({
  /** 网络研讨会ID */
  meetingid: z.string(),
  /** 查询报名 ID 的排序规则。1：优先查询手机号导入报名，再查询成员手动报名；2：优先查询成员手动报名，再查手机号导入 (1-优先查询手机号导入报名，再查询成员手动报名, 2-优先查询成员手动报名，再查手机号导入) */
  sorting_rules: z.number().optional(),
  /** 当场会议的成员临时 ID 数组 */
  tmp_openid_list: z.array(z.string()),
});
export type QueryWebinarEnrollIdByTmpOpenidRequest = z.infer<typeof QueryWebinarEnrollIdByTmpOpenidRequestSchema>;
export const QueryWebinarEnrollIdByTmpOpenidResponseSchema = z.object({
  /** 成员报名 ID 数组，仅返回已报名成员的报名 ID */
  enroll_id_list: z.array(z.object({ tmp_openid: z.string(), enroll_id: z.string() })).optional(),
});
export type QueryWebinarEnrollIdByTmpOpenidResponse = z.infer<typeof QueryWebinarEnrollIdByTmpOpenidResponseSchema>;

/**
 * 修改网络研讨会报名配置
 * @see https://developer.work.weixin.qq.com/document/path/99029
 */
export const SetWebinarEnrollConfigRequestSchema = z.object({
  /** 网络研讨会 ID */
  meetingid: z.string(),
  /** 审批类型 (1-自动审批, 2-手动审批) */
  approve_type: z.number().optional(),
  /** 是否收集问题 (1-不收集, 2-收集) */
  is_collect_question: z.number().optional(),
  /** 本企业成员无需报名 (true-本企业成员无需报名, false-默认配置，本企业成员及企业外成员需要报名) */
  no_registration_needed_for_staff: z.boolean().optional(),
  /** 报名问题列表 */
  question_list: z.array(z.object({ is_required: z.number(), question_title: z.string().max(40), option_list: z.array(z.object({ content: z.string().max(40) })), question_type: z.number(), special_type: z.number() })).optional(),
});
export type SetWebinarEnrollConfigRequest = z.infer<typeof SetWebinarEnrollConfigRequestSchema>;
export const SetWebinarEnrollConfigResponseSchema = z.object({
  /** 报名问题数量，不收集问题时该字段返回0 */
  question_count: z.number().default(0).optional(),
});
export type SetWebinarEnrollConfigResponse = z.infer<typeof SetWebinarEnrollConfigResponseSchema>;

/**
 * 获取网络研讨会详情
 * @see https://developer.work.weixin.qq.com/document/path/99020
 */
export const GetWebinarDetailRequestSchema = z.object({
  /** 网络研讨会ID，meetingid 和 meeting_code 二者必须送一个，二者都送时以 meetingid 为准。 */
  meetingid: z.string().optional(),
  /** 网络研讨会的会议号，meetingid 和 meeting_code 二者必须送一个，二者都送时以 meetingid 为准。 */
  meeting_code: z.string().optional(),
});
export type GetWebinarDetailRequest = z.infer<typeof GetWebinarDetailRequestSchema>;
export const GetWebinarDetailResponseSchema = z.object({
  /** 网络研讨会ID。 */
  meetingid: z.string().optional(),
  /** 网络研讨会主题。 */
  title: z.string().optional(),
  /** 主办方名称。 */
  sponsor: z.string().optional(),
  /** 会议开始时间戳（单位秒）。 [timestamp] */
  start_time: z.number().optional(),
  /** 会议结束时间戳（单位秒）。 [timestamp] */
  end_time: z.number().optional(),
  /** 观众观看限制类型。 (0-公开, 1-报名, 2-密码) */
  admission_type: z.number().optional(),
  /** 主持人的成员 ID。 */
  hosts: z.array(z.object({ userid: z.string() })).optional(),
  /** 观众观看密码（4~6位数字）。 */
  password: z.string().min(4).max(6).optional(),
  /** 封面图片 URL。 */
  cover_url: z.string().optional(),
  /** 网络研讨会描述详情，仅支持纯文本。 */
  description: z.string().min(1).max(5000).optional(),
  /** 是否开启通过邀请链接自动成为嘉宾。 (true-开启, false-不开启) */
  enable_guest_invite_link: z.boolean().optional(),
  /** 观众入会链接。 */
  audience_join_link: z.string().optional(),
  /** 嘉宾入会链接。 */
  guest_join_link: z.string().optional(),
  /** 媒体参数配置。 */
  media_setting: z.object({ mute_enable_join: z.boolean().default(false), allow_unmute_self: z.boolean().default(false), allow_enter_before_host: z.boolean().default(false), enable_screen_watermark: z.boolean(), watermark_type: z.number(), allow_external_user: z.boolean(), auto_record_type: z.string(), attendee_join_auto_record: z.boolean().default(false), enable_host_pause_auto_record: z.boolean().default(false) }).optional(),
  /** 是否开启问答。 (true-开启, false-不开启) */
  enable_qa: z.boolean().optional(),
  /** 人工审核链接。 */
  manual_check_link: z.string().optional(),
  /** 人工审核密码。 */
  manual_check_password: z.string().optional(),
  /** 活动页开启配置。 (true-开启活动页, false-不开启活动页) */
  activity_page: z.boolean().optional(),
  /** 活动页展示已报名或已预约人数。 (0-不展示, 1-展示) */
  display_number_of_attendees: z.number().optional(),
  /** 允许观众观看回放。 (true-允许, false-不允许) */
  playback_for_audience: z.boolean().optional(),
  /** 回放地址。 */
  playback_url: z.string().optional(),
  /** 是否开启准备模式。 (true-开启, false-关闭) */
  preparation_mode: z.boolean().optional(),
  /** 暖场图片地址。 */
  warm_up_picture: z.string().optional(),
  /** 暖场视频地址。 */
  warm_up_video: z.string().optional(),
  /** 允许参会者在暖场中邀请成员。 (true-允许, false-不允许) */
  allow_attendees_invite_others: z.boolean().optional(),
});
export type GetWebinarDetailResponse = z.infer<typeof GetWebinarDetailResponseSchema>;

/**
 * 获取网络研讨会嘉宾列表
 * @see https://developer.work.weixin.qq.com/document/path/99019
 */
export const ListWebinarGuestRequestSchema = z.object({
  /** 网络研讨会ID。meetingid 和 meeting_code 二者必须送一个，二者都送时以 meeing_id 为准 */
  meetingid: z.string().optional(),
  /** 网络研讨会的会议号。meetingid 和 meeting_code 二者必须送一个，二者都送时以 meeing_id 为准 */
  meeting_code: z.string().optional(),
});
export type ListWebinarGuestRequest = z.infer<typeof ListWebinarGuestRequestSchema>;
export const ListWebinarGuestResponseSchema = z.object({
  /** 网络研讨会嘉宾列表 */
  guests: z.array(z.object({ guest_type: z.number(), userid: z.string(), area: z.string(), phone_number: z.string(), guest_name: z.string().min(1).max(16), email: z.string() })).optional(),
});
export type ListWebinarGuestResponse = z.infer<typeof ListWebinarGuestResponseSchema>;

/**
 * 修改网络研讨会
 * @see https://developer.work.weixin.qq.com/document/path/98843
 */
export const UpdateWebinarRequestSchema = z.object({
  /** 网络研讨会ID */
  meetingid: z.string(),
  /** 网络研讨会主题 */
  title: z.string().min(1).max(255),
  /** 主办方名称 */
  sponsor: z.string().min(1).max(40).optional(),
  /** 会议开始时间戳（单位秒），不能少于当前时间戳半小时以上 [timestamp] */
  start_time: z.number(),
  /** 会议结束时间戳（单位秒） [timestamp] */
  end_time: z.number(),
  /** 观众观看限制类型 (0-公开, 1-报名, 2-密码) */
  admission_type: z.number(),
  /** 主持人的成员 ID，默认为网络研讨会管理员admin_userid。修改时传入，则会覆盖原有设置 */
  hosts: z.array(z.object({ userid: z.string().min(1).max(64) })).optional(),
  /** 观众观看密码（4~6位数字），当admission_type=2时必传 */
  password: z.string().min(4).max(6).optional(),
  /** 封面图片 URL，图片仅支持PNG和JPEG格式，分辨率需大于640x360，推荐使用1280x720的高清图片，文件需控制在5MB以内。该参数需要开启活动页配 */
  cover_url: z.string().optional(),
  /** 网络研讨会描述详情，仅支持纯文本，1~5000位字符长度。该参数需要开启活动页配置（activity_page） */
  description: z.string().min(1).max(5000).optional(),
  /** 是否开启通过邀请链接自动成为嘉宾，默认false (true-开启, false-不开启) */
  enable_guest_invite_link: z.boolean().optional(),
  /** 媒体参数配置 */
  media_setting: z.object({ enable_enter_mute: z.boolean(), allow_unmute_self: z.boolean(), allow_enter_before_host: z.boolean(), enable_screen_watermark: z.boolean(), watermark_type: z.number(), allow_external_user: z.boolean(), auto_record_type: z.string(), attendee_join_auto_record: z.boolean(), enable_host_pause_auto_record: z.boolean() }).optional(),
  /** 是否开启问答，默认true (true-开启, false-不开启) */
  enable_qa: z.boolean().optional(),
  /** 聊天敏感词，最多可添加50个，单个限制10个中文字符长度 */
  sensitive_words: z.array(z.string()).optional(),
  /** 是否开启人工审核，默认false (true-开启, false-不开启) */
  enable_manual_check: z.boolean().optional(),
  /** 活动页开启配置，默认true (true-开启, false-不开启) */
  activity_page: z.boolean().optional(),
  /** 活动页展示已报名或已预约人数，默认1（开启）。该参数需要开启活动页配置（activity_page） (0-不展示, 1-展示) */
  display_number_of_attendees: z.number().optional(),
  /** 允许观众观看回放，默认false。开启本选项时必须开启云录制（auto_record_type=cloud） (true-允许, false-不允许) */
  playback_for_audience: z.boolean(),
  /** 是否开启准备模式，默认false (true-开启, false-关闭) */
  preparation_mode: z.boolean().optional(),
});
export type UpdateWebinarRequest = z.infer<typeof UpdateWebinarRequestSchema>;

/**
 * 更新网络研讨会嘉宾列表
 * @see https://developer.work.weixin.qq.com/document/path/99091
 */
export const UpdateWebinarGuestListRequestSchema = z.object({
  /** 网络研讨会ID */
  meetingid: z.string(),
  /** 网络研讨会嘉宾列表 */
  guests: z.array(z.object({ guest_type: z.number(), userid: z.string(), area: z.string(), phone_number: z.string(), guest_name: z.string().min(1).max(16), email: z.string() })),
});
export type UpdateWebinarGuestListRequest = z.infer<typeof UpdateWebinarGuestListRequestSchema>;

/**
 * 管理网络研讨会暖场配置
 * @see https://developer.work.weixin.qq.com/document/path/99030
 */
export const UpdateWebinarWarmUpConfigRequestSchema = z.object({
  /** 网络研讨会ID。 */
  meetingid: z.string(),
  /** 暖场图片地址。暖场图片与暖场视频只能选择一个，如果同时传入图片和视频，以图片为准。图片推荐 1280*720 尺寸，支持 png/jpg 格式，大小不超过 5M */
  warm_up_picture: z.string().optional(),
  /** 暖场视频地址。暖场图片与暖场视频只能选择一个，如果同时传入图片和视频，以图片为准。推荐 1280*720 尺寸，支持 mp4 格式，大小不超过 1G。会议开始前 */
  warm_up_video: z.string().optional(),
  /** 允许参会者在暖场中邀请成员。true：允许，默认允许；false：不允许。 (true-允许, false-不允许) */
  allow_attendees_invite_others: z.boolean().optional(),
});
export type UpdateWebinarWarmUpConfigRequest = z.infer<typeof UpdateWebinarWarmUpConfigRequestSchema>;

