// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 新建文档
 * @see https://developer.work.weixin.qq.com/document/path/97658
 */
export const CreateDocRequestSchema = z.object({
  /** 空间spaceid。若指定spaceid，则fatherid也要同时指定 */
  spaceid: z.string().optional(),
  /** 父目录fileid, 在根目录时为空间spaceid */
  fatherid: z.string().optional(),
  /** 文档类型 (3-文档, 4-表格, 10-智能表格) */
  doc_type: z.number(),
  /** 文档名字（注意：文件名最多填255个字符，超过255个字符会被截断） */
  doc_name: z.string().max(255),
  /** 文档管理员userid */
  admin_users: z.array(z.string()).optional(),
});
export type CreateDocRequest = z.infer<typeof CreateDocRequestSchema>;
export const CreateDocResponseSchema = z.object({
  /** 新建文档的访问链接 */
  url: z.string().optional(),
  /** 新建文档的docid。docid仅在创建时返回，需要开发者妥善保存 */
  docid: z.string().optional(),
});
export type CreateDocResponse = z.infer<typeof CreateDocResponseSchema>;

/**
 * 创建收集表
 * @see https://developer.work.weixin.qq.com/document/path/97668
 */
export const CreateFormRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string().optional(),
  /** 父目录fileid, 在根目录时为空间spaceid */
  fatherid: z.string().optional(),
  /** 收集表信息 */
  form_info: z.object({ form_title: z.string(), form_desc: z.string(), form_header: z.string(), form_question: z.object({ items: z.array(z.object({ question_id: z.string(), title: z.string(), pos: z.string(), status: z.number(), reply_type: z.number(), must_reply: z.boolean(), note: z.string(), placeholder: z.string(), question_extend_setting: z.object({ text_setting: z.object({ validation_type: z.number(), validation_detail: z.number(), char_len: z.string(), number_min: z.string(), number_max: z.string() }), radio_setting: z.object({ add_other_option: z.boolean() }), checkbox_setting: z.object({ add_other_option: z.boolean(), type: z.number(), number: z.string() }), location_setting: z.object({ location_type: z.number(), distance_type: z.number() }), image_setting: z.object({ camera_only: z.boolean().default(false), upload_image_limit: z.object({ count_limit_type: z.number(), count: z.string().default(9), max_size: z.string() }) }), file_setting: z.object({ upload_file_limit: z.object({ count_limit_type: z.number(), count: z.string().default(9), max_size: z.string() }) }), date_setting: z.object({ date_format_type: z.number() }), time_setting: z.object({ time_format_type: z.number() }), duration_setting: z.object({ time_scale: z.number(), date_type: z.number(), day_range: z.string().default(24) }), temperature_setting: z.object({ unit_type: z.number() }), department_setting: z.object({ allow_multiple_selection: z.boolean().default(false) }), member_setting: z.object({ allow_multiple_selection: z.boolean().default(false) }) }), option_item: z.array(z.object({ key: z.string(), value: z.string(), status: z.number() })) })) }), form_setting: z.object({ fill_out_auth: z.number(), fill_in_range: z.object({ userids: z.array(z.string()), departmentids: z.string() }), setting_manager_range: z.object({ userids: z.array(z.string()) }), timed_repeat_info: z.object({ enable: z.boolean().default(false), remind_time: z.string().default(0), repeat_type: z.number(), week_flag: z.number(), skip_holiday: z.boolean().default(false), day_of_month: z.string(), fork_finish_type: z.number() }), allow_multi_fill: z.boolean().default(false), timed_finish: z.string().default(0), can_anonymous: z.boolean().default(false), can_notify_submit: z.boolean().default(false) }) }),
});
export type CreateFormRequest = z.infer<typeof CreateFormRequestSchema>;
export const CreateFormResponseSchema = z.object({
  /** 收集表id */
  formid: z.string().optional(),
});
export type CreateFormResponse = z.infer<typeof CreateFormResponseSchema>;

/**
 * 删除文档
 * @see https://developer.work.weixin.qq.com/document/path/99930
 */
export const DeleteDocRequestSchema = z.object({
  /** 文档docid（docid、formid只能填其中一个），仅可删除应用自己创建的文档 */
  docid: z.string().min(1).optional(),
  /** 收集表id（docid、formid只能填其中一个），仅可删除应用自己创建的收集表 */
  formid: z.string().min(1).optional(),
});
export type DeleteDocRequest = z.infer<typeof DeleteDocRequestSchema>;

/**
 * 获取文档权限信息
 * @see https://developer.work.weixin.qq.com/document/path/97811
 */
export const GetDocAuthRequestSchema = z.object({
  /** 文档id */
  docid: z.string().min(1),
});
export type GetDocAuthRequest = z.infer<typeof GetDocAuthRequestSchema>;
export const GetDocAuthResponseSchema = z.object({
  /** 文档的查看规则 */
  access_rule: z.object({ enable_corp_internal: z.boolean(), corp_internal_auth: z.number(), enable_corp_external: z.boolean(), corp_external_auth: z.number(), corp_internal_approve_only_by_admin: z.boolean(), corp_external_approve_only_by_admin: z.boolean(), ban_share_external: z.boolean() }).optional(),
  /** 安全设置信息 */
  secure_setting: z.object({ enable_readonly_copy: z.boolean(), watermark: z.object({ margin_type: z.number(), show_visitor_name: z.boolean(), show_text: z.boolean(), text: z.string().min(0) }), enable_readonly_comment: z.boolean() }).optional(),
  /** 文档通知范围及权限列表 */
  doc_member_list: z.array(z.object({ type: z.number(), userid: z.string().min(1), tmp_external_userid: z.string().min(1), auth: z.number() })).optional(),
  /** 文档查看权限特定部门列表，可以直接浏览文档 */
  co_auth_list: z.array(z.object({ type: z.number(), departmentid: z.number().min(1), auth: z.number() })).optional(),
});
export type GetDocAuthResponse = z.infer<typeof GetDocAuthResponseSchema>;

/**
 * 分享文档
 * @see https://developer.work.weixin.qq.com/document/path/97733
 */
export const ShareDocRequestSchema = z.object({
  /** 文档ID，与formid二选一 */
  docid: z.string().optional(),
  /** 表单ID，与docid二选一 */
  formid: z.string().optional(),
});
export type ShareDocRequest = z.infer<typeof ShareDocRequestSchema>;
export const ShareDocResponseSchema = z.object({
  /** 文档分享链接 */
  share_url: z.string().optional(),
});
export type ShareDocResponse = z.infer<typeof ShareDocResponseSchema>;

/**
 * 编辑文档内容
 * @see https://developer.work.weixin.qq.com/document/path/97626
 */
export const BatchUpdateDocumentRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string().min(1),
  /** 操作的文档版本，该参数可以通过获取文档内容接口获得。操作后文档版本将更新一版。要更新的文档版本与最新文档版本相差不能超过100个。 */
  version: z.number().optional(),
  /** 更新操作列表，单次批量更新操作数量 <= 30 */
  requests: z.array(z.object({ replace_text: z.object({ text: z.string(), ranges: z.array(z.object({ start_index: z.number(), length: z.number() })) }), insert_text: z.object({ text: z.string(), location: z.object({ index: z.number() }) }), delete_content: z.object({ range: z.object({ start_index: z.number(), length: z.number() }) }), insert_image: z.object({ image_id: z.string(), location: z.object({ index: z.number() }), width: z.number(), height: z.number() }), insert_page_break: z.object({ location: z.object({ index: z.number() }) }), insert_table: z.object({ rows: z.number().min(1).max(100), cols: z.number().min(1).max(60), location: z.object({ index: z.number() }) }), insert_paragraph: z.object({ location: z.object({ index: z.number() }) }), update_text_property: z.object({ text_property: z.object({ bold: z.boolean(), color: z.string(), background_color: z.string() }), ranges: z.array(z.object({ start_index: z.number(), length: z.number() })) }) })),
});
export type BatchUpdateDocumentRequest = z.infer<typeof BatchUpdateDocumentRequestSchema>;

/**
 * 获取文档数据
 * @see https://developer.work.weixin.qq.com/document/path/101161
 */
export const GetWedocDocumentRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
});
export type GetWedocDocumentRequest = z.infer<typeof GetWedocDocumentRequestSchema>;
export const GetWedocDocumentResponseSchema = z.object({
  /** 文档版本 */
  version: z.number().optional(),
  /** 文档内容根节点，详见Node */
  document: z.object({ begin: z.number(), end: z.number(), property: z.object({ section_property: z.record(z.string(), z.any()), paragraph_property: z.record(z.string(), z.any()), run_property: z.record(z.string(), z.any()), table_property: z.record(z.string(), z.any()), table_row_property: z.record(z.string(), z.any()), table_cell_property: z.record(z.string(), z.any()), drawing_property: z.record(z.string(), z.any()) }), type: z.string(), children: z.array(z.object({ begin: z.number(), end: z.number(), property: z.record(z.string(), z.any()), type: z.string(), children: z.array(z.record(z.string(), z.any())), text: z.string() })), text: z.string() }).optional(),
});
export type GetWedocDocumentResponse = z.infer<typeof GetWedocDocumentResponseSchema>;

/**
 * 获取文档基础信息
 * @see https://developer.work.weixin.qq.com/document/path/97734
 */
export const GetDocBaseInfoRequestSchema = z.object({
  /** 文档docid */
  docid: z.string(),
});
export type GetDocBaseInfoRequest = z.infer<typeof GetDocBaseInfoRequestSchema>;
export const GetDocBaseInfoResponseSchema = z.object({
  /** 文档基础信息对象 */
  doc_base_info: z.object({ docid: z.string(), doc_name: z.string(), create_time: z.number(), modify_time: z.number(), doc_type: z.number() }).optional(),
});
export type GetDocBaseInfoResponse = z.infer<typeof GetDocBaseInfoResponseSchema>;

/**
 * 读取收集表答案
 * @see https://developer.work.weixin.qq.com/document/path/97819
 */
export const GetWedocFormAnswerRequestSchema = z.object({
  /** 操作的收集表周期id */
  repeated_id: z.string(),
  /** 需要拉取的答案列表，批次大小最大100 */
  answer_ids: z.array(z.number()),
});
export type GetWedocFormAnswerRequest = z.infer<typeof GetWedocFormAnswerRequestSchema>;
export const GetWedocFormAnswerResponseSchema = z.object({
  /** 答案 */
  answer: z.object({ answer_list: z.array(z.object({ answer_id: z.number(), user_name: z.string(), ctime: z.number(), mtime: z.number(), reply: z.object({ items: z.array(z.object({ question_id: z.number(), text_reply: z.string(), option_reply: z.string(), option_extend_reply: z.array(z.object({ option_reply: z.string(), extend_text: z.string() })), file_extend_reply: z.array(z.object({ name: z.string(), fileid: z.string() })), department_reply: z.object({ list: z.array(z.object({ department_id: z.number() })) }), member_reply: z.object({ list: z.array(z.object({ userid: z.string() })) }), duration_reply: z.object({ begin_time: z.string(), end_time: z.string(), time_scale: z.number(), day_range: z.string(), days: z.number(), hours: z.number() }), answer_status: z.number(), tmp_external_userid: z.string() })) }), answer_status: z.number(), tmp_external_userid: z.string() })) }).optional(),
});
export type GetWedocFormAnswerResponse = z.infer<typeof GetWedocFormAnswerResponseSchema>;

/**
 * 获取收集表信息
 * @see https://developer.work.weixin.qq.com/document/path/97817
 */
export const GetFormInfoRequestSchema = z.object({
  /** 操作的收集表ID */
  formid: z.string(),
});
export type GetFormInfoRequest = z.infer<typeof GetFormInfoRequestSchema>;
export const GetFormInfoResponseSchema = z.object({
  /** 收集表信息 */
  form_info: z.object({ formid: z.string(), form_title: z.string(), form_desc: z.string(), form_header: z.string(), form_question: z.object({ items: z.array(z.object({ question_id: z.number(), title: z.string(), pos: z.number(), status: z.number(), reply_type: z.number(), must_reply: z.boolean(), note: z.string(), placeholder: z.string(), option_item: z.array(z.object({ key: z.number(), value: z.string(), status: z.number() })) })) }), form_setting: z.object({ fill_out_auth: z.number(), fill_in_range: z.object({ departmentids: z.array(z.number()), userids: z.array(z.string()) }), setting_manager_range: z.object({ userids: z.array(z.string()) }), timed_repeat_info: z.object({ enable: z.boolean(), remind_time: z.number(), rule_ctime: z.number(), rule_mtime: z.number(), repeat_type: z.number(), skip_holiday: z.boolean() }), allow_multi_fill: z.boolean(), timed_finish: z.number(), can_anonymous: z.boolean(), can_notify_submit: z.boolean() }), repeated_id: z.array(z.string()) }).optional(),
});
export type GetFormInfoResponse = z.infer<typeof GetFormInfoResponseSchema>;

/**
 * 收集表的统计信息查询
 * @see https://developer.work.weixin.qq.com/document/path/97818
 */
export const GetFormStatisticRequestSchema = z.object({
  /** 操作的收集表的repeated_id，来源于get_form_info的返回 */
  repeated_id: z.string(),
  /** 请求类型 1:只获取统计结果 2:获取已提交列表 3:获取未提交列表 (1-只获取统计结果, 2-获取已提交列表, 3-获取未提交列表) */
  req_type: z.number(),
  /** 拉取已提交列表时必填，其余type不填。筛选开始时间，以当天的00:00:00开始筛选 [timestamp] */
  start_time: z.number().optional(),
  /** 拉取已提交列表时必填，其余type不填。筛选结束时间，以当天的23:59:59结束筛选 [timestamp] */
  end_time: z.number().optional(),
  /** 分页拉取时批次大小，最大10000 */
  limit: z.number().max(10000).optional(),
  /** 分页拉取的游标，首次不传 */
  cursor: z.number().optional(),
});
export type GetFormStatisticRequest = z.infer<typeof GetFormStatisticRequestSchema>;
export const GetFormStatisticResponseSchema = z.object({
  /** 已填写次数 */
  fill_cnt: z.number().optional(),
  /** 已填写人数 */
  fill_user_cnt: z.number().optional(),
  /** 未填写人数 */
  unfill_user_cnt: z.number().optional(),
  /** 已填写人列表 */
  submit_users: z.array(z.object({ userid: z.string(), submit_time: z.number(), answer_id: z.number(), user_name: z.string(), tmp_external_userid: z.string() })).optional(),
  /** 未填写人列表 */
  unfill_users: z.array(z.object({ userid: z.string(), user_name: z.string() })).optional(),
  /** 是否还有更多 */
  has_more: z.boolean().optional(),
  /** 上次分页拉取返回的cursor */
  cursor: z.number().optional(),
});
export type GetFormStatisticResponse = z.infer<typeof GetFormStatisticResponseSchema>;

/**
 * 修改文档加入规则
 * @see https://developer.work.weixin.qq.com/document/path/101477
 */
export const UpdateDocJoinRuleRequestSchema = z.object({
  /** 操作的docid */
  docid: z.string().min(1),
  /** 是否允许企业内成员浏览文档，有值则覆盖 */
  enable_corp_internal: z.boolean().optional(),
  /** 企业内成员主动查看文档后获得的权限类型 1:只读 2:读写，有值则覆盖 (1-只读, 2-读写) */
  corp_internal_auth: z.number().optional(),
  /** 是否允许企业外成员浏览文档，有值则覆盖 */
  enable_corp_external: z.boolean().optional(),
  /** 企业外成员主浏览文档后获得的权限类型 1:只读 2:读写，有值则覆盖 (1-只读, 2-读写) */
  corp_external_auth: z.number().optional(),
  /** 企业内成员加入文档是否必须由管理员审批，enable_corp_internal为false时，只能为true，有值则覆盖。设置为true之前，文档需要有至少一 */
  corp_internal_approve_only_by_admin: z.boolean().optional(),
  /** 企业外成员加入文档是否必须由管理员审批，enable_corp_external和ban_share_external均为false时，该参数只能为true，有 */
  corp_external_approve_only_by_admin: z.boolean().optional(),
  /** 是否禁止文档分享到企业外，有值则覆盖 */
  ban_share_external: z.boolean().optional(),
  /** 是否更新文档查看权限的特定部门，true时更新特定部门列表 */
  update_co_auth_list: z.boolean().optional(),
  /** 需要更新文档查看权限特定部门时，覆盖之前部门，特别的：列表为空则清空 */
  co_auth_list: z.array(z.object({ departmentid: z.number(), auth: z.number(), type: z.number() })).optional(),
});
export type UpdateDocJoinRuleRequest = z.infer<typeof UpdateDocJoinRuleRequestSchema>;

/**
 * 修改文档成员与权限
 * @see https://developer.work.weixin.qq.com/document/path/101476
 */
export const UpdateDocMemberRequestSchema = z.object({
  /** 操作的文档id */
  docid: z.string(),
  /** 更新文档成员的列表，批次大小最大100 */
  update_file_member_list: z.array(z.object({ type: z.number(), auth: z.number(), userid: z.string() })).optional(),
  /** 删除的文档成员列表，批次大小最大一百 */
  del_file_member_list: z.array(z.object({ type: z.number(), userid: z.string(), tmp_external_userid: z.string() })).optional(),
});
export type UpdateDocMemberRequest = z.infer<typeof UpdateDocMemberRequestSchema>;

/**
 * 修改文档安全设置
 * @see https://developer.work.weixin.qq.com/document/path/97782
 */
export const UpdateDocSafetySettingRequestSchema = z.object({
  /** 操作的文档id */
  docid: z.string(),
  /** 是否允许只读成员复制、下载文档，有值则覆盖 */
  enable_readonly_copy: z.boolean().optional(),
  /** 水印设置 */
  watermark: z.object({ margin_type: z.number(), show_visitor_name: z.boolean(), show_text: z.boolean(), text: z.string() }).optional(),
});
export type UpdateDocSafetySettingRequest = z.infer<typeof UpdateDocSafetySettingRequestSchema>;

/**
 * 编辑收集表
 * @see https://developer.work.weixin.qq.com/document/path/97816
 */
export const ModifyFormRequestSchema = z.object({
  /** 操作类型。1：全量修改问题；2：全量修改设置 (1-全量修改问题, 2-全量修改设置) */
  oper: z.number(),
  /** 收集表id */
  formid: z.string().min(1),
  /** 收集表信息对象 */
  form_info: z.object({ form_title: z.string().min(1), form_desc: z.string().min(1), form_header: z.string().min(1), form_question: z.object({ items: z.array(z.object({ question_id: z.number().min(1), title: z.string().min(1), pos: z.number().min(1), status: z.number(), reply_type: z.number(), must_reply: z.boolean(), note: z.string().min(1), placeholder: z.string().min(1), question_extend_setting: z.record(z.string(), z.any()), option_item: z.array(z.object({ key: z.number().min(1), value: z.string().min(1), status: z.number() })) })) }), form_setting: z.object({ fill_out_auth: z.number(), fill_in_range: z.object({ userids: z.array(z.string()), departmentids: z.array(z.number()) }), setting_manager_range: z.object({ userids: z.array(z.string()) }), timed_repeat_info: z.object({ enable: z.boolean(), remind_time: z.number().min(0), repeat_type: z.number(), week_flag: z.number(), skip_holiday: z.boolean(), day_of_month: z.number().min(1).max(31), fork_finish_type: z.number() }), allow_multi_fill: z.boolean().default(false), timed_finish: z.number().min(0), can_anonymous: z.boolean().default(false), can_notify_submit: z.boolean().default(false) }) }).optional(),
});
export type ModifyFormRequest = z.infer<typeof ModifyFormRequestSchema>;

/**
 * 重命名文档
 * @see https://developer.work.weixin.qq.com/document/path/99894
 */
export const RenameDocRequestSchema = z.object({
  /** 文档docid（docid、formid只能填其中一个），仅可修改应用自己创建的文档 */
  docid: z.string().min(1).optional(),
  /** 收集表id（docid、formid只能填其中一个），仅可修改应用自己创建的收集表 */
  formid: z.string().min(1).optional(),
  /** 重命名后的文档名（注意：文档名最多填255个字符，英文算1个，汉字算2个，超过255个字符会被截断） */
  new_name: z.string().min(1).max(255),
});
export type RenameDocRequest = z.infer<typeof RenameDocRequestSchema>;

/**
 * 添加编组
 * @see https://developer.work.weixin.qq.com/document/path/101100
 */
export const AddFieldGroupRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 表格ID */
  sheet_id: z.string(),
  /** 编组名称，不能和已有名称重复 */
  name: z.string(),
  /** 编组内容 */
  children: z.array(z.object({ field_id: z.string() })).optional(),
});
export type AddFieldGroupRequest = z.infer<typeof AddFieldGroupRequestSchema>;
export const AddFieldGroupResponseSchema = z.object({
  /** 编组 */
  field_group: z.object({ field_group_id: z.string(), name: z.string(), children: z.array(z.object({ field_id: z.string() })) }).optional(),
});
export type AddFieldGroupResponse = z.infer<typeof AddFieldGroupResponseSchema>;

/**
 * 添加字段
 * @see https://developer.work.weixin.qq.com/document/path/99904
 */
export const AddSmartsheetFieldsRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 表格ID */
  sheet_id: z.string(),
  /** 字段详情 */
  fields: z.array(z.object({ field_title: z.string(), field_type: z.string(), property_number: z.object({ decimal_places: z.number(), use_separate: z.boolean() }), property_checkbox: z.object({ checked: z.boolean() }), property_date_time: z.object({ format: z.string(), auto_fill: z.boolean() }), property_attachment: z.object({ display_mode: z.string() }), property_user: z.object({ is_multiple: z.boolean(), is_notified: z.boolean() }), property_url: z.object({ type: z.string() }), property_select: z.object({ is_quick_add: z.boolean(), options: z.array(z.record(z.string(), z.any())) }), property_created_time: z.object({ format: z.string() }), property_modified_time: z.object({ format: z.string() }), property_progress: z.object({ decimal_places: z.number() }), property_single_select: z.object({ is_quick_add: z.boolean(), options: z.array(z.record(z.string(), z.any())) }), property_reference: z.object({ sub_id: z.string(), filed_id: z.string(), is_multiple: z.boolean(), view_id: z.string() }), property_location: z.object({ input_type: z.string() }), property_auto_number: z.object({ type: z.string(), rules: z.array(z.record(z.string(), z.any())), reformat_existing_record: z.boolean() }), property_currency: z.object({ currency_type: z.string(), decimal_places: z.number(), use_separate: z.boolean() }), property_ww_group: z.object({ allow_multiple: z.boolean() }), property_percentage: z.object({ decimal_places: z.number(), use_separate: z.boolean() }), property_barcode: z.object({ mobile_scan_only: z.boolean() }) })),
});
export type AddSmartsheetFieldsRequest = z.infer<typeof AddSmartsheetFieldsRequestSchema>;
export const AddSmartsheetFieldsResponseSchema = z.object({
  /** 字段详情 */
  fields: z.array(z.object({ field_id: z.string(), field_title: z.string(), field_type: z.string() })).optional(),
});
export type AddSmartsheetFieldsResponse = z.infer<typeof AddSmartsheetFieldsResponseSchema>;

/**
 * 添加记录
 * @see https://developer.work.weixin.qq.com/document/path/99907
 */
export const AddRecordsRequestSchema = z.object({
  /** 文档的 docid */
  docid: z.string(),
  /** Smartsheet 子表 ID */
  sheet_id: z.string(),
  /** 返回记录中单元格的 key 类型，默认用标题 (CELL_VALUE_KEY_TYPE_FIELD_TITLE-key 用字段标题表示, CELL_VALUE_K...) */
  key_type: z.string().optional(),
  /** 需要添加的记录的具体内容组成的 JSON 数组 */
  records: z.array(z.object({ values: z.record(z.string(), z.any()) })),
});
export type AddRecordsRequest = z.infer<typeof AddRecordsRequestSchema>;
export const AddRecordsResponseSchema = z.object({
  /** 由添加成功的记录的具体内容组成的 JSON 数组 */
  records: z.array(z.object({ record_id: z.string(), values: z.record(z.string(), z.any()) })).optional(),
});
export type AddRecordsResponse = z.infer<typeof AddRecordsResponseSchema>;

/**
 * 添加子表
 * @see https://developer.work.weixin.qq.com/document/path/99896
 */
export const AddSmartSheetRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 智能表属性 */
  properties: z.object({ title: z.string(), index: z.number() }).optional(),
});
export type AddSmartSheetRequest = z.infer<typeof AddSmartSheetRequestSchema>;
export const AddSmartSheetResponseSchema = z.object({
  /** 智能表属性 */
  properties: z.object({ title: z.string(), index: z.number(), sheet_id: z.string() }).optional(),
});
export type AddSmartSheetResponse = z.infer<typeof AddSmartSheetResponseSchema>;

/**
 * 添加视图
 * @see https://developer.work.weixin.qq.com/document/path/99900
 */
export const AddViewRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** Smartsheet 子表ID */
  sheet_id: z.string(),
  /** 视图标题 */
  view_title: z.string(),
  /** 视图类型 (VEW_UNKNOWN-未知类型视图, VIEW_TYPE_GRID-表格视图, VIEW_TYPE_KANBAN...) */
  view_type: z.string(),
  /** 甘特视图属性，添加甘特图时必填 */
  property_gantt: z.object({ start_date_field_id: z.string(), end_date_field_id: z.string() }).optional(),
  /** 日历视图属性，添加日历视图时必填 */
  property_calendar: z.object({ start_date_field_id: z.string(), end_date_field_id: z.string() }).optional(),
});
export type AddViewRequest = z.infer<typeof AddViewRequestSchema>;
export const AddViewResponseSchema = z.object({
  /** 添加视图响应 */
  view: z.object({ view_id: z.string(), view_title: z.string(), view_type: z.string() }).optional(),
});
export type AddViewResponse = z.infer<typeof AddViewResponseSchema>;

/**
 * 查询智能表格子表权限
 * @see https://developer.work.weixin.qq.com/document/path/99935
 */
export const GetSheetPrivRequestSchema = z.object({
  /** 智能表ID，通过新建文档接口创建后获得 */
  docid: z.string(),
  /** 权限规则类型，1-全员权限，2-额外权限 (1-全员权限, 2-额外权限) */
  type: z.number(),
  /** 需要查询的规则id列表，查询额外权限时填写 */
  rule_id_list: z.array(z.string()).optional(),
});
export type GetSheetPrivRequest = z.infer<typeof GetSheetPrivRequestSchema>;
export const GetSheetPrivResponseSchema = z.object({
  /** 权限列表 */
  rule_list: z.array(z.object({ rule_id: z.number(), type: z.number(), name: z.string(), priv_list: z.array(z.object({ sheet_id: z.string(), priv: z.number(), can_insert_record: z.boolean(), can_delete_record: z.boolean(), can_create_modify_delete_view: z.boolean(), field_priv: z.object({ field_range_type: z.number(), field_rule_list: z.array(z.object({ field_id: z.string(), field_type: z.string(), can_edit: z.boolean(), can_insert: z.boolean(), can_view: z.boolean() })), field_default_rule: z.object({ can_edit: z.boolean(), can_insert: z.boolean(), can_view: z.boolean() }) }), record_priv: z.object({ record_range_type: z.number(), record_rule_list: z.array(z.object({ field_id: z.string(), field_type: z.string(), oper_type: z.number(), value: z.array(z.string()) })), other_priv: z.number() }), clear: z.boolean() })) })).optional(),
});
export type GetSheetPrivResponse = z.infer<typeof GetSheetPrivResponseSchema>;

/**
 * 删除编组
 * @see https://developer.work.weixin.qq.com/document/path/101102
 */
export const DeleteSmartsheetFieldGroupsRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 子表ID */
  sheet_id: z.string(),
  /** 要删除的编组 ID */
  field_group_ids: z.array(z.string()),
});
export type DeleteSmartsheetFieldGroupsRequest = z.infer<typeof DeleteSmartsheetFieldGroupsRequestSchema>;

/**
 * 删除字段
 * @see https://developer.work.weixin.qq.com/document/path/99905
 */
export const DeleteSmartsheetFieldsRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 表格ID */
  sheet_id: z.string(),
  /** 需要删除的字段id列表 */
  field_ids: z.array(z.string()),
});
export type DeleteSmartsheetFieldsRequest = z.infer<typeof DeleteSmartsheetFieldsRequestSchema>;

/**
 * 删除记录
 * @see https://developer.work.weixin.qq.com/document/path/99908
 */
export const DeleteSmartsheetRecordsRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** Smartsheet 子表ID */
  sheet_id: z.string(),
  /** 要删除的记录 ID */
  record_ids: z.array(z.string()),
});
export type DeleteSmartsheetRecordsRequest = z.infer<typeof DeleteSmartsheetRecordsRequestSchema>;

/**
 * 删除子表
 * @see https://developer.work.weixin.qq.com/document/path/99899
 */
export const DeleteSheetRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 删除的Smartsheet 子表 ID */
  sheet_id: z.string(),
});
export type DeleteSheetRequest = z.infer<typeof DeleteSheetRequestSchema>;

/**
 * 删除视图
 * @see https://developer.work.weixin.qq.com/document/path/99901
 */
export const DeleteViewsRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** Smartsheet 子表ID */
  sheet_id: z.string(),
  /** 要删除的视图ID列表 */
  view_ids: z.array(z.string()),
});
export type DeleteViewsRequest = z.infer<typeof DeleteViewsRequestSchema>;

/**
 * 获取编组
 * @see https://developer.work.weixin.qq.com/document/path/101103
 */
export const GetFieldGroupsRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 表格ID */
  sheet_id: z.string(),
  /** 偏移量，初始值为 0 */
  offset: z.number().min(0).default(0).optional(),
  /** 分页大小 , 每页返回多少条数据 */
  limit: z.number().optional(),
});
export type GetFieldGroupsRequest = z.infer<typeof GetFieldGroupsRequestSchema>;
export const GetFieldGroupsResponseSchema = z.object({
  /** 编组数量 */
  total: z.number().optional(),
  /** 是否还有更多数据 */
  has_more: z.boolean().optional(),
  /** 下一偏移位置 */
  next: z.number().min(0).optional(),
  /** 编组列表 */
  field_groups: z.array(z.object({ field_group_id: z.string(), name: z.string(), children: z.array(z.object({ field_id: z.string() })) })).optional(),
});
export type GetFieldGroupsResponse = z.infer<typeof GetFieldGroupsResponseSchema>;

/**
 * 查询字段
 * @see https://developer.work.weixin.qq.com/document/path/101157
 */
export const GetSmartSheetFieldsRequestSchema = z.object({
  /** 文档的 docid */
  docid: z.string().min(1),
  /** 表格 ID */
  sheet_id: z.string().min(1),
  /** 视图 ID */
  view_id: z.string().min(1).optional(),
  /** 由字段 ID 组成的 JSON 数组 */
  field_ids: z.array(z.string()).optional(),
  /** 由字段标题组成的 JSON 数组 */
  field_titles: z.array(z.string()).optional(),
  /** 偏移量，初始值为 0 */
  offset: z.number().min(0).default(0).optional(),
  /** 分页大小，每页返回多少条数据；最大值为 1000 */
  limit: z.number().min(0).max(1000).optional(),
});
export type GetSmartSheetFieldsRequest = z.infer<typeof GetSmartSheetFieldsRequestSchema>;
export const GetSmartSheetFieldsResponseSchema = z.object({
  /** 字段总数 */
  total: z.number().min(0).optional(),
  /** 字段详情 */
  fields: z.array(z.object({ field_id: z.string().min(1), field_title: z.string().min(1), field_type: z.string(), property_number: z.object({ decimal_places: z.number(), use_separate: z.boolean() }), property_checkbox: z.object({ checked: z.boolean() }), property_date_time: z.object({ format: z.string(), auto_fill: z.boolean() }), property_attachment: z.object({ display_mode: z.string() }), property_user: z.object({ is_multiple: z.boolean(), is_notified: z.boolean() }), property_url: z.object({ type: z.string() }), property_select: z.object({ is_quick_add: z.boolean(), options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1), style: z.number() })) }), property_created_time: z.object({ format: z.string() }), property_modified_time: z.object({ format: z.string() }), property_progress: z.object({ decimal_places: z.number() }), property_single_select: z.object({ is_quick_add: z.boolean(), options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1), style: z.number() })) }), property_reference: z.object({ sub_id: z.string().min(1), field_id: z.string().min(1), is_multiple: z.boolean(), view_id: z.string().min(1) }), property_location: z.object({ input_type: z.string() }), property_auto_number: z.object({ type: z.string(), rules: z.array(z.object({ type: z.string(), value: z.string() })), reformat_existing_record: z.boolean() }), property_currency: z.object({ currency_type: z.string(), decimal_places: z.number(), use_separate: z.boolean() }), property_ww_group: z.object({ allow_multiple: z.boolean() }), property_percentage: z.object({ decimal_places: z.number(), use_separate: z.boolean() }), property_barcode: z.object({ mobile_scan_only: z.boolean() }) })).optional(),
});
export type GetSmartSheetFieldsResponse = z.infer<typeof GetSmartSheetFieldsResponseSchema>;

/**
 * 查询记录
 * @see https://developer.work.weixin.qq.com/document/path/101158
 */
export const GetSmartsheetRecordsRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** Smartsheet 子表ID */
  sheet_id: z.string(),
  /** 视图 ID */
  view_id: z.string().optional(),
  /** 由记录 ID 组成的 JSON 数组 */
  record_ids: z.array(z.any()).optional(),
  /** 返回记录中单元格的key类型 (CELL_VALUE_KEY_TYPE_FIELD_TITLE-key用字段标题表示, CELL_VALUE_KE...) */
  key_type: z.string().optional(),
  /** 返回指定列，由字段标题组成的 JSON 数组，key_type 为 CELL_VALUE_KEY_TYPE_FIELD_TITLE 时有效 */
  field_titles: z.array(z.any()).optional(),
  /** 返回指定列，由字段 ID 组成的 JSON 数组，key_type 为 CELL_VALUE_KEY_TYPE_FIELD_ID 时有效 */
  field_ids: z.array(z.any()).optional(),
  /** 对返回记录进行排序 */
  sort: z.array(z.object({ field_title: z.string(), desc: z.boolean().default(false) })).optional(),
  /** 偏移量，初始值为 0 */
  offset: z.number().min(0).default(0).optional(),
  /** 分页大小，每页返回多少条数据；当不填写该参数或将该参数设置为 0 时，如果总数大于 1000，一次性返回 1000 行记录，当总数小于 1000 时，返回全部记 */
  limit: z.number().min(0).max(1000).optional(),
  /** 版本号 */
  ver: z.number().optional(),
  /** 过滤设置，不支持和sort一起使用 */
  filter_spec: z.object({ conjunction: z.string(), conditions: z.array(z.object({ field_id: z.string(), field_type: z.string(), operator: z.string(), string_value: z.object({ value: z.array(z.string()) }) })) }).optional(),
});
export type GetSmartsheetRecordsRequest = z.infer<typeof GetSmartsheetRecordsRequestSchema>;
export const GetSmartsheetRecordsResponseSchema = z.object({
  /** 版本号 */
  ver: z.number().optional(),
  /** 符合筛选条件的视图总数 */
  total: z.number().optional(),
  /** 是否还有更多项 */
  has_more: z.boolean().optional(),
  /** 下次下一个搜索结果的偏移量 */
  next: z.number().optional(),
  /** 由查询记录的具体内容组成的 JSON 数组 */
  records: z.array(z.object({ record_id: z.string(), create_time: z.string(), update_time: z.string(), values: z.record(z.string(), z.any()), creator_name: z.string(), updater_name: z.string() })).optional(),
});
export type GetSmartsheetRecordsResponse = z.infer<typeof GetSmartsheetRecordsResponseSchema>;

/**
 * 查询子表
 * @see https://developer.work.weixin.qq.com/document/path/101154
 */
export const GetSheetRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 指定子表ID查询 */
  sheet_id: z.string().optional(),
  /** 获取所有类型子表。为true时可获取包含仪表盘和说明页在内的所有类型的子表 */
  need_all_type_sheet: z.boolean().optional(),
});
export type GetSheetRequest = z.infer<typeof GetSheetRequestSchema>;
export const GetSheetResponseSchema = z.object({
  /** 智能表信息列表 */
  sheet_list: z.array(z.object({ sheet_id: z.string(), title: z.string(), is_visible: z.boolean(), type: z.string() })).optional(),
});
export type GetSheetResponse = z.infer<typeof GetSheetResponseSchema>;

/**
 * 查询视图
 * @see https://developer.work.weixin.qq.com/document/path/101155
 */
export const GetSmartsheetViewsRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** Smartsheet 子表ID */
  sheet_id: z.string(),
  /** 需要查询的视图 ID 数组 */
  view_ids: z.array(z.string()).optional(),
  /** 偏移量，初始值为 0 */
  offset: z.number().min(0).optional(),
  /** 分页大小，每页返回多少条数据；当不填写该参数或将该参数设置为 0 时，如果总数大于 1000，一次性返回 1000 个视图，当总数小于 1000 时，返回全部视 */
  limit: z.number().min(0).max(1000).optional(),
});
export type GetSmartsheetViewsRequest = z.infer<typeof GetSmartsheetViewsRequestSchema>;
export const GetSmartsheetViewsResponseSchema = z.object({
  /** 符合筛选条件的视图总数 */
  total: z.number().optional(),
  /** 是否还有更多项 */
  has_more: z.boolean().optional(),
  /** 下次下一个搜索结果的偏移量 */
  next: z.number().optional(),
  /** 视图数据 */
  views: z.array(z.object({ view_id: z.string(), view_title: z.string(), view_type: z.string(), property: z.object({ auto_sort: z.boolean(), sort_spec: z.object({ sort_infos: z.array(z.object({ field_id: z.string(), desc: z.boolean() })) }), group_spec: z.object({ groups: z.array(z.object({ field_id: z.string(), desc: z.boolean() })) }), filter_spec: z.object({ conjunction: z.string(), conditions: z.array(z.object({ field_id: z.string(), field_type: z.string(), operator: z.string() })) }), is_field_stat_enabled: z.boolean(), field_visibility: z.record(z.string(), z.any()), frozen_field_count: z.number(), color_config: z.object({ conditions: z.array(z.object({ id: z.string(), type: z.string(), color: z.string() })) }) }) })).optional(),
});
export type GetSmartsheetViewsResponse = z.infer<typeof GetSmartsheetViewsResponseSchema>;

/**
 * 更新编组
 * @see https://developer.work.weixin.qq.com/document/path/101101
 */
export const UpdateFieldGroupRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 表格ID */
  sheet_id: z.string(),
  /** 编组id */
  field_group_id: z.string(),
  /** 编组名称，不能和已有名称重复 */
  name: z.string().optional(),
  /** 编组内容 */
  children: z.array(z.object({ field_id: z.string() })).optional(),
});
export type UpdateFieldGroupRequest = z.infer<typeof UpdateFieldGroupRequestSchema>;
export const UpdateFieldGroupResponseSchema = z.object({
  /** 编组信息 */
  field_group: z.object({ field_group_id: z.string(), name: z.string(), children: z.array(z.object({ field_id: z.string() })) }).optional(),
});
export type UpdateFieldGroupResponse = z.infer<typeof UpdateFieldGroupResponseSchema>;

/**
 * 更新字段
 * @see https://developer.work.weixin.qq.com/document/path/99906
 */
export const UpdateSmartSheetFieldsRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 表格ID */
  sheet_id: z.string(),
  /** 字段详情 */
  fields: z.array(z.object({ field_id: z.string(), field_title: z.string(), field_type: z.string(), property_text: z.record(z.string(), z.any()), property_number: z.record(z.string(), z.any()), property_checkbox: z.record(z.string(), z.any()), property_date_time: z.record(z.string(), z.any()), property_attachment: z.record(z.string(), z.any()), property_user: z.record(z.string(), z.any()), property_url: z.record(z.string(), z.any()), property_select: z.record(z.string(), z.any()), property_created_user: z.record(z.string(), z.any()), property_modified_user: z.record(z.string(), z.any()), property_created_time: z.record(z.string(), z.any()), property_modified_time: z.record(z.string(), z.any()), property_progress: z.record(z.string(), z.any()), property_single_select: z.record(z.string(), z.any()), property_reference: z.record(z.string(), z.any()), property_location: z.record(z.string(), z.any()), property_auto_number: z.record(z.string(), z.any()), property_currency: z.record(z.string(), z.any()), property_ww_group: z.record(z.string(), z.any()), property_percentage: z.record(z.string(), z.any()), property_barcode: z.record(z.string(), z.any()) })),
});
export type UpdateSmartSheetFieldsRequest = z.infer<typeof UpdateSmartSheetFieldsRequestSchema>;
export const UpdateSmartSheetFieldsResponseSchema = z.object({
  /** 字段详情 */
  fields: z.array(z.object({ field_id: z.string(), field_title: z.string(), field_type: z.string() })).optional(),
});
export type UpdateSmartSheetFieldsResponse = z.infer<typeof UpdateSmartSheetFieldsResponseSchema>;

/**
 * 更新记录
 * @see https://developer.work.weixin.qq.com/document/path/99909
 */
export const UpdateSmartsheetRecordsRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** Smartsheet 子表ID */
  sheet_id: z.string(),
  /** 返回记录中单元格的key类型 (CELL_VALUE_KEY_TYPE_FIELD_TITLE-key用字段标题表示, CELL_VALUE_KE...) */
  key_type: z.string().optional(),
  /** 由需要更新的记录组成的 JSON 数组 */
  records: z.array(z.object({ record_id: z.string(), values: z.record(z.string(), z.any()) })),
});
export type UpdateSmartsheetRecordsRequest = z.infer<typeof UpdateSmartsheetRecordsRequestSchema>;
export const UpdateSmartsheetRecordsResponseSchema = z.object({
  /** 由更新成功的记录的具体内容组成的 JSON 数组 */
  records: z.array(z.object({ record_id: z.string(), values: z.record(z.string(), z.any()) })).optional(),
});
export type UpdateSmartsheetRecordsResponse = z.infer<typeof UpdateSmartsheetRecordsResponseSchema>;

/**
 * 更新子表
 * @see https://developer.work.weixin.qq.com/document/path/99898
 */
export const UpdateSmartsheetSubSheetRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 子表属性对象 */
  properties: z.object({ sheet_id: z.string(), title: z.string() }),
});
export type UpdateSmartsheetSubSheetRequest = z.infer<typeof UpdateSmartsheetSubSheetRequestSchema>;

/**
 * 更新视图
 * @see https://developer.work.weixin.qq.com/document/path/99902
 */
export const UpdateViewRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** Smartsheet 子表ID */
  sheet_id: z.string(),
  /** 视图ID */
  view_id: z.string(),
  /** 视图标题 */
  view_title: z.string().optional(),
  /** 视图的排序/过滤/分组/填色配置 */
  property: z.object({ auto_sort: z.boolean(), sort_spec: z.object({ sort_infos: z.array(z.object({ field_id: z.string(), desc: z.boolean() })) }), group_spec: z.object({ groups: z.array(z.object({ field_id: z.string(), desc: z.boolean() })) }), filter_spec: z.object({ conjunction: z.string(), conditions: z.array(z.object({ field_id: z.string(), field_type: z.string(), operator: z.string(), string_value: z.object({ value: z.array(z.string()) }), number_value: z.object({ value: z.string() }), bool_value: z.object({ value: z.boolean() }), user_value: z.object({ value: z.array(z.string()) }), date_time_value: z.object({ type: z.string(), value: z.array(z.string()) }) })) }), is_field_stat_enabled: z.boolean(), field_visibility: z.record(z.string(), z.any()), frozen_field_count: z.string(), color_config: z.object({ conditions: z.array(z.object({ id: z.string(), type: z.string(), color: z.string(), condition: z.object({ field_id: z.string(), field_type: z.string(), operator: z.string(), number_value: z.object({ value: z.string() }) }) })) }) }).optional(),
});
export type UpdateViewRequest = z.infer<typeof UpdateViewRequestSchema>;
export const UpdateViewResponseSchema = z.object({
  /** 更新成功的视图内容 */
  view: z.object({ view_id: z.string(), view_title: z.string(), view_type: z.string(), property: z.record(z.string(), z.any()) }).optional(),
});
export type UpdateViewResponse = z.infer<typeof UpdateViewResponseSchema>;

/**
 * 更新记录
 * @see https://developer.work.weixin.qq.com/document/path/101260
 */
export const UpdateSmartSheetRecordRequestSchema = z.object({
  /** Webhook 地址中的 key 值，用于标识工作表 */
  key: z.string(),
  /** 由需要更新的记录组成的 JSON 数组 */
  update_records: z.array(z.object({ record_id: z.string(), values: z.record(z.string(), z.any()) })),
});
export type UpdateSmartSheetRecordRequest = z.infer<typeof UpdateSmartSheetRecordRequestSchema>;
export const UpdateSmartSheetRecordResponseSchema = z.object({
  /** 由更新成功的记录的具体内容组成的 JSON 数组 */
  update_records: z.array(z.object({ record_id: z.string(), values: z.record(z.string(), z.any()) })).optional(),
});
export type UpdateSmartSheetRecordResponse = z.infer<typeof UpdateSmartSheetRecordResponseSchema>;

/**
 * 编辑表格内容
 * @see https://developer.work.weixin.qq.com/document/path/101168
 */
export const BatchUpdateSpreadsheetRequestSchema = z.object({
  /** 文档的docid */
  docid: z.string(),
  /** 更新操作列表，单次批量更新请求的操作数量 <= 5 */
  requests: z.array(z.object({ add_sheet_request: z.object({ title: z.string(), row_count: z.string(), column_count: z.string() }), update_range_request: z.object({ sheet_id: z.string(), grid_data: z.record(z.string(), z.any()) }), delete_dimension_request: z.object({ sheet_id: z.string(), dimension: z.string(), start_index: z.string(), end_index: z.string() }), delete_sheet_request: z.object({ sheet_id: z.string() }) })),
});
export type BatchUpdateSpreadsheetRequest = z.infer<typeof BatchUpdateSpreadsheetRequestSchema>;
export const BatchUpdateSpreadsheetResponseSchema = z.object({
  /** 响应数据 */
  data: z.object({ responses: z.array(z.object({ add_sheet_response: z.record(z.string(), z.any()), update_range_response: z.object({ updated_cells: z.string() }), delete_dimension_response: z.object({ deleted: z.number() }), delete_sheet_response: z.object({ sheet_id: z.string() }) })) }).optional(),
});
export type BatchUpdateSpreadsheetResponse = z.infer<typeof BatchUpdateSpreadsheetResponseSchema>;

/**
 * 获取表格行列信息
 * @see https://developer.work.weixin.qq.com/document/path/97711
 */
export const GetSpreadsheetPropertiesRequestSchema = z.object({
  /** 在线表格的docid */
  docid: z.string().min(1),
});
export type GetSpreadsheetPropertiesRequest = z.infer<typeof GetSpreadsheetPropertiesRequestSchema>;
export const GetSpreadsheetPropertiesResponseSchema = z.object({
  /** 工作表属性 */
  properties: z.array(z.object({ sheet_id: z.string().min(1), title: z.string().min(1), row_count: z.number().min(0), column_count: z.number().min(0) })).optional(),
});
export type GetSpreadsheetPropertiesResponse = z.infer<typeof GetSpreadsheetPropertiesResponseSchema>;

/**
 * 获取表格数据
 * @see https://developer.work.weixin.qq.com/document/path/97661
 */
export const GetSheetRangeDataRequestSchema = z.object({
  /** 在线表格唯一标识 */
  docid: z.string().min(1),
  /** 工作表ID，工作表的唯一标识 */
  sheet_id: z.string().min(1),
  /** 查询的范围，格式遵循A1表示法 */
  range: z.string().min(2),
});
export type GetSheetRangeDataRequest = z.infer<typeof GetSheetRangeDataRequestSchema>;
export const GetSheetRangeDataResponseSchema = z.object({
  /** 表格数据 */
  data: z.object({ result: z.object({ start_row: z.number().min(0), start_column: z.number().min(0), rows: z.array(z.object({ values: z.array(z.object({ cell_value: z.object({ text: z.string().min(0), link: z.object({ url: z.string().min(1), text: z.string().min(0) }) }), cell_format: z.object({ text_format: z.object({ font: z.string().min(1), font_size: z.number().min(1).max(72), bold: z.boolean().default(false), italic: z.boolean().default(false), strikethrough: z.boolean().default(false), underline: z.boolean().default(false), color: z.object({ red: z.number().min(0).max(255), green: z.number().min(0).max(255), blue: z.number().min(0).max(255), alpha: z.number().min(0).max(255).default(255) }) }) }) })) })) }) }).optional(),
});
export type GetSheetRangeDataResponse = z.infer<typeof GetSheetRangeDataResponseSchema>;

/**
 * 分配高级功能账号
 * @see https://developer.work.weixin.qq.com/document/path/99516
 */
export const BatchAddWedDocVipRequestSchema = z.object({
  /** 要分配高级功能的企业成员userid列表，单次操作最大限制100个 */
  userid_list: z.array(z.string()),
});
export type BatchAddWedDocVipRequest = z.infer<typeof BatchAddWedDocVipRequestSchema>;
export const BatchAddWedDocVipResponseSchema = z.object({
  /** 分配成功的userid列表，包括已经是高级功能账号的userid */
  succ_userid_list: z.array(z.string()).optional(),
  /** 分配失败的userid列表 */
  fail_userid_list: z.array(z.string()).optional(),
});
export type BatchAddWedDocVipResponse = z.infer<typeof BatchAddWedDocVipResponseSchema>;

/**
 * 取消高级功能账号
 * @see https://developer.work.weixin.qq.com/document/path/99517
 */
export const BatchDeleteDocVipRequestSchema = z.object({
  /** 要撤销分配高级功能的企业成员userid列表，单次操作最多限制100个 */
  userid_list: z.array(z.string()),
});
export type BatchDeleteDocVipRequest = z.infer<typeof BatchDeleteDocVipRequestSchema>;
export const BatchDeleteDocVipResponseSchema = z.object({
  /** 撤销分配成功的userid列表 */
  succ_userid_list: z.array(z.string()).optional(),
  /** 撤销分配失败的userid列表 */
  fail_userid_list: z.array(z.string()).optional(),
});
export type BatchDeleteDocVipResponse = z.infer<typeof BatchDeleteDocVipResponseSchema>;

/**
 * 获取高级功能账号列表
 * @see https://developer.work.weixin.qq.com/document/path/99518
 */
export const ListVipAccountRequestSchema = z.object({
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().optional(),
  /** 用于分页查询，每次请求返回的数据上限。默认100，最大200 */
  limit: z.number().max(200).default(100).optional(),
});
export type ListVipAccountRequest = z.infer<typeof ListVipAccountRequestSchema>;
export const ListVipAccountResponseSchema = z.object({
  /** 是否还有更多数据未获取 */
  has_more: z.boolean().optional(),
  /** 下一次请求的cursor值 */
  next_cursor: z.string().optional(),
  /** 符合条件的企业成员userid列表 */
  userid_list: z.array(z.string()).optional(),
});
export type ListVipAccountResponse = z.infer<typeof ListVipAccountResponseSchema>;

