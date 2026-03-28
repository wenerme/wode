// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 添加客服账号
 * @see https://developer.work.weixin.qq.com/document/path/94662
 */
export const AddKfAccountRequestSchema = z.object({
  /** 客服名称 */
  name: z.string().max(16),
  /** 客服头像临时素材。可以调用上传临时素材接口获取。 */
  media_id: z.string().max(128),
});
export type AddKfAccountRequest = z.infer<typeof AddKfAccountRequestSchema>;
export const AddKfAccountResponseSchema = z.object({
  /** 新创建的客服账号ID */
  open_kfid: z.string().optional(),
});
export type AddKfAccountResponse = z.infer<typeof AddKfAccountResponseSchema>;

/**
 * 删除客服账号
 * @see https://developer.work.weixin.qq.com/document/path/94663
 */
export const DeleteKfAccountRequestSchema = z.object({
  /** 客服账号ID */
  open_kfid: z.string().max(64),
});
export type DeleteKfAccountRequest = z.infer<typeof DeleteKfAccountRequestSchema>;

/**
 * 获取客服账号列表
 * @see https://developer.work.weixin.qq.com/document/path/94706
 */
export const ListKfAccountRequestSchema = z.object({
  /** 分页，偏移量 */
  offset: z.number().min(0).default(0).optional(),
  /** 分页，预期请求的数据量 */
  limit: z.number().min(1).max(100).default(100).optional(),
});
export type ListKfAccountRequest = z.infer<typeof ListKfAccountRequestSchema>;
export const ListKfAccountResponseSchema = z.object({
  /** 账号信息列表 */
  account_list: z.array(z.object({ open_kfid: z.string(), name: z.string(), avatar: z.string(), manage_privilege: z.boolean() })).optional(),
});
export type ListKfAccountResponse = z.infer<typeof ListKfAccountResponseSchema>;

/**
 * 修改客服账号
 * @see https://developer.work.weixin.qq.com/document/path/94682
 */
export const UpdateKfAccountRequestSchema = z.object({
  /** 要修改的客服账号ID */
  open_kfid: z.string().min(1).max(64),
  /** 新的客服名称，如不需要修改可不填 */
  name: z.string().min(1).max(48).optional(),
  /** 新的客服头像临时素材，如不需要修改可不填。可以调用上传临时素材接口获取 */
  media_id: z.string().min(1).max(128).optional(),
});
export type UpdateKfAccountRequest = z.infer<typeof UpdateKfAccountRequestSchema>;

/**
 * 获取客户基础信息
 * @see https://developer.work.weixin.qq.com/document/path/95171
 */
export const BatchGetCustomerRequestSchema = z.object({
  /** external_userid列表，可填充个数1~100，超过需分批调用 */
  external_userid_list: z.array(z.string()),
  /** 是否需要返回客户48小时内最后一次进入会话的上下文信息 (0-不返回, 1-返回) */
  need_enter_session_context: z.number().optional(),
});
export type BatchGetCustomerRequest = z.infer<typeof BatchGetCustomerRequestSchema>;
export const BatchGetCustomerResponseSchema = z.object({
  /** 返回结果列表 */
  customer_list: z.array(z.object({ external_userid: z.string(), nickname: z.string(), avatar: z.string(), gender: z.number(), unionid: z.string(), enter_session_context: z.object({ scene: z.string(), scene_param: z.string(), wechat_channels: z.object({ nickname: z.string(), shop_nickname: z.string(), scene: z.number() }) }) })).optional(),
  /** 无效的external_userid列表 */
  invalid_external_userid: z.array(z.string()).optional(),
});
export type BatchGetCustomerResponse = z.infer<typeof BatchGetCustomerResponseSchema>;

export const GetUpgradeServiceConfigResponseSchema = z.object({
  /** 专员服务配置范围 */
  member_range: z.record(z.string(), z.any()).optional(),
  /** 客户群配置范围 */
  groupchat_range: z.record(z.string(), z.any()).optional(),
});
export type GetUpgradeServiceConfigResponse = z.infer<typeof GetUpgradeServiceConfigResponseSchema>;

/**
 * 获取「客户数据统计」企业汇总数据
 * @see https://developer.work.weixin.qq.com/document/path/95489
 */
export const GetCorpStatisticRequestSchema = z.object({
  /** 客服账号ID */
  open_kfid: z.string(),
  /** 起始日期的时间戳，填这一天的0时0分0秒。取值范围：昨天至前180天 [timestamp] */
  start_time: z.number(),
  /** 结束日期的时间戳，填这一天的0时0分0秒。取值范围：昨天至前180天。最大查询跨度为31天 [timestamp] */
  end_time: z.number(),
});
export type GetCorpStatisticRequest = z.infer<typeof GetCorpStatisticRequestSchema>;
export const GetCorpStatisticResponseSchema = z.object({
  /** 统计数据列表 */
  statistic_list: z.array(z.object({ stat_time: z.number(), statistic: z.object({ session_cnt: z.number(), customer_cnt: z.number(), customer_msg_cnt: z.number(), upgrade_service_customer_cnt: z.number(), ai_session_reply_cnt: z.number(), ai_transfer_rate: z.number(), ai_knowledge_hit_rate: z.number(), msg_rejected_customer_cnt: z.number() }) })).optional(),
});
export type GetCorpStatisticResponse = z.infer<typeof GetCorpStatisticResponseSchema>;

/**
 * 获取「客户数据统计」接待人员明细数据
 * @see https://developer.work.weixin.qq.com/document/path/95490
 */
export const GetServicerStatisticRequestSchema = z.object({
  /** 客服账号ID */
  open_kfid: z.string(),
  /** 接待人员的userid。第三方应用为密文userid，即open_userid */
  servicer_userid: z.string().optional(),
  /** 起始日期的时间戳，填当天的0时0分0秒。取值范围：昨天至前180天 [timestamp] */
  start_time: z.number(),
  /** 结束日期的时间戳，填当天的0时0分0秒。取值范围：昨天至前180天 [timestamp] */
  end_time: z.number(),
});
export type GetServicerStatisticRequest = z.infer<typeof GetServicerStatisticRequestSchema>;
export const GetServicerStatisticResponseSchema = z.object({
  /** 统计数据列表 */
  statistic_list: z.array(z.object({ stat_time: z.number(), statistic: z.object({ session_cnt: z.number(), customer_cnt: z.number(), customer_msg_cnt: z.number(), reply_rate: z.number(), first_reply_average_sec: z.number(), satisfaction_investgate_cnt: z.number(), satisfaction_participation_rate: z.number(), satisfied_rate: z.number(), middling_rate: z.number(), dissatisfied_rate: z.number(), upgrade_service_customer_cnt: z.number(), upgrade_service_member_invite_cnt: z.number(), upgrade_service_member_customer_cnt: z.number(), upgrade_service_groupchat_invite_cnt: z.number(), upgrade_service_groupchat_customer_cnt: z.number(), msg_rejected_customer_cnt: z.number() }) })).optional(),
});
export type GetServicerStatisticResponse = z.infer<typeof GetServicerStatisticResponseSchema>;

/**
 * 添加知识库分组
 * @see https://developer.work.weixin.qq.com/document/path/95971
 */
export const AddKnowledgeGroupRequestSchema = z.object({
  /** 分组名。不超过12个字 */
  name: z.string().min(1).max(12),
});
export type AddKnowledgeGroupRequest = z.infer<typeof AddKnowledgeGroupRequestSchema>;
export const AddKnowledgeGroupResponseSchema = z.object({
  /** 分组ID */
  group_id: z.string().optional(),
});
export type AddKnowledgeGroupResponse = z.infer<typeof AddKnowledgeGroupResponseSchema>;

/**
 * 添加问答
 * @see https://developer.work.weixin.qq.com/document/path/95972
 */
export const AddKnowledgeIntentRequestSchema = z.object({
  /** 分组ID */
  group_id: z.string(),
  /** 主问题 */
  question: z.object({ text: z.object({ content: z.string().min(1).max(200) }) }),
  /** 相似问题 */
  similar_questions: z.object({ items: z.array(z.object({ text: z.object({ content: z.string().min(1).max(200) }) })) }).optional(),
  /** 回答列表。目前仅支持1个 */
  answers: z.array(z.object({ text: z.object({ content: z.string().min(1).max(500) }), attachments: z.array(z.object({ msgtype: z.string(), image: z.object({ media_id: z.string().min(1) }), video: z.object({ media_id: z.string().min(1) }), link: z.object({ title: z.string().min(1), desc: z.string().min(0), url: z.string().min(1), pic_url: z.string().min(0) }), miniprogram: z.object({ title: z.string().min(0).max(64), thumb_media_id: z.string().min(1), appid: z.string().min(1), pagepath: z.string().min(1) }) })) })),
});
export type AddKnowledgeIntentRequest = z.infer<typeof AddKnowledgeIntentRequestSchema>;
export const AddKnowledgeIntentResponseSchema = z.object({
  /** 问答ID */
  intent_id: z.string().optional(),
});
export type AddKnowledgeIntentResponse = z.infer<typeof AddKnowledgeIntentResponseSchema>;

/**
 * 发送消息
 * @see https://developer.work.weixin.qq.com/document/path/94677
 */
export const SendKfMsgRequestSchema = z.object({
  /** 指定接收消息的客户UserID */
  touser: z.string().min(1),
  /** 指定发送消息的客服账号ID */
  open_kfid: z.string().min(1),
  /** 指定消息ID。若指定需确保客服账号内唯一，否则返回错误。最多32字节。取值范围：[0-9a-zA-Z_-]* */
  msgid: z.string().min(1).max(32).optional(),
  /** 消息类型。可选值：text, image, voice, video, file, link, miniprogram, msgmenu, location, (text-文本消息, image-图片消息, voice-语音消息, vide */
  msgtype: z.string(),
  /** 文本消息对象。当msgtype为text时必填 */
  text: z.object({ content: z.string().min(1).max(2048) }).optional(),
  /** 图片消息对象。当msgtype为image时必填 */
  image: z.object({ media_id: z.string().min(1) }).optional(),
  /** 语音消息对象。当msgtype为voice时必填 */
  voice: z.object({ media_id: z.string().min(1) }).optional(),
  /** 视频消息对象。当msgtype为video时必填 */
  video: z.object({ media_id: z.string().min(1) }).optional(),
  /** 文件消息对象。当msgtype为file时必填 */
  file: z.object({ media_id: z.string().min(1) }).optional(),
  /** 图文链接消息对象。当msgtype为link时必填 */
  link: z.object({ title: z.string().min(1).max(128), desc: z.string().min(0).max(512), url: z.string().min(1).max(2048), thumb_media_id: z.string().min(1) }).optional(),
  /** 小程序消息对象。当msgtype为miniprogram时必填 */
  miniprogram: z.object({ appid: z.string().min(1), title: z.string().min(0).max(64), thumb_media_id: z.string().min(1), pagepath: z.string().min(1) }).optional(),
  /** 菜单消息对象。当msgtype为msgmenu时必填 */
  msgmenu: z.object({ head_content: z.string().min(0).max(1024), list: z.array(z.object({ type: z.string(), click: z.object({ id: z.string().min(1).max(128), content: z.string().min(1).max(128) }), view: z.object({ url: z.string().min(1).max(2048), content: z.string().min(1).max(1024) }), miniprogram: z.object({ appid: z.string().min(1).max(32), pagepath: z.string().min(1).max(1024), content: z.string().min(1).max(1024) }), text: z.object({ content: z.string().min(1).max(256), no_newline: z.number() }) })), tail_content: z.string().min(0).max(1024) }).optional(),
  /** 地理位置消息对象。当msgtype为location时必填 */
  location: z.object({ name: z.string().min(0), address: z.string().min(0), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).optional(),
  /** 获客链接消息对象。当msgtype为ca_link时必填 */
  ca_link: z.object({ link_url: z.string().min(1) }).optional(),
});
export type SendKfMsgRequest = z.infer<typeof SendKfMsgRequestSchema>;
export const SendKfMsgResponseSchema = z.object({
  /** 消息ID。如果请求参数指定了msgid，则原样返回，否则系统自动生成并返回 */
  msgid: z.string().min(1).max(32).optional(),
});
export type SendKfMsgResponse = z.infer<typeof SendKfMsgResponseSchema>;

/**
 * 发送欢迎语等事件响应消息
 * @see https://developer.work.weixin.qq.com/document/path/95122
 */
export const SendKfEventMsgRequestSchema = z.object({
  /** 事件响应消息对应的code。通过事件回调下发，仅可使用一次。 */
  code: z.string(),
  /** 消息ID。如果请求参数指定了msgid，则原样返回，否则系统自动生成并返回。 */
  msgid: z.string().min(1).max(32).optional(),
  /** 消息类型。text或msgmenu (text-文本消息, msgmenu-菜单消息) */
  msgtype: z.string(),
  /** 文本消息对象，仅当msgtype为text时必填 */
  text: z.object({ content: z.string().min(1).max(2048) }).optional(),
  /** 菜单消息对象，仅当msgtype为msgmenu时必填 */
  msgmenu: z.object({ head_content: z.string().min(1).max(1024), list: z.array(z.object({ type: z.string(), click: z.object({ id: z.string().min(1).max(128), content: z.string().min(1).max(128) }), view: z.object({ url: z.string().min(1).max(2048), content: z.string().min(1).max(1024) }), miniprogram: z.object({ appid: z.string().min(1).max(32), pagepath: z.string().min(1).max(1024), content: z.string().min(1).max(1024) }), text: z.object({ content: z.string().min(1).max(256), no_newline: z.number() }) })), tail_content: z.string().min(1).max(1024) }).optional(),
});
export type SendKfEventMsgRequest = z.infer<typeof SendKfEventMsgRequestSchema>;
export const SendKfEventMsgResponseSchema = z.object({
  /** 消息ID */
  msgid: z.string().optional(),
});
export type SendKfEventMsgResponse = z.infer<typeof SendKfEventMsgResponseSchema>;

/**
 * 变更会话状态
 * @see https://developer.work.weixin.qq.com/document/path/94669
 */
export const TransferServiceStateRequestSchema = z.object({
  /** 客服账号ID */
  open_kfid: z.string(),
  /** 微信客户的external_userid */
  external_userid: z.string(),
  /** 变更的目标状态，0-未处理，1-由智能助手接待，2-待接入池排队中，3-由人工接待，4-已结束/未开始 (0-未处理, 1-由智能助手接待, 2-待接入池排队中, 3-由人工接待, 4-已结束/未开始) */
  service_state: z.number(),
  /** 接待人员的userid。第三方应用填密文userid，即open_userid。当service_state=3时要求必填 */
  servicer_userid: z.string().optional(),
});
export type TransferServiceStateRequest = z.infer<typeof TransferServiceStateRequestSchema>;
export const TransferServiceStateResponseSchema = z.object({
  /** 用于发送响应事件消息的code。service_state为2和3时返回回复语code，service_state为4时返回结束语code */
  msg_code: z.string().optional(),
});
export type TransferServiceStateResponse = z.infer<typeof TransferServiceStateResponseSchema>;

/**
 * 添加接待人员
 * @see https://developer.work.weixin.qq.com/document/path/94722
 */
export const AddServicerRequestSchema = z.object({
  /** 客服账号ID */
  open_kfid: z.string(),
  /** 接待人员userid列表。第三方应用填密文userid，即open_userid。可填充个数：0 ~ 100。超过100个需分批调用。 */
  userid_list: z.array(z.string()).optional(),
  /** 接待人员部门id列表。可填充个数：0 ~ 20。 */
  department_id_list: z.array(z.number()).optional(),
});
export type AddServicerRequest = z.infer<typeof AddServicerRequestSchema>;
export const AddServicerResponseSchema = z.object({
  /** 操作结果 */
  result_list: z.array(z.object({ userid: z.string(), department_id: z.number(), errcode: z.number(), errmsg: z.string() })).optional(),
});
export type AddServicerResponse = z.infer<typeof AddServicerResponseSchema>;

/**
 * 删除接待人员
 * @see https://developer.work.weixin.qq.com/document/path/94723
 */
export const DeleteServiceUserRequestSchema = z.object({
  /** 客服账号ID */
  open_kfid: z.string(),
  /** 接待人员userid列表。第三方应用填密文userid，即open_userid */
  userid_list: z.array(z.string()).optional(),
  /** 接待人员部门id列表 */
  department_id_list: z.array(z.number()).optional(),
});
export type DeleteServiceUserRequest = z.infer<typeof DeleteServiceUserRequestSchema>;
export const DeleteServiceUserResponseSchema = z.object({
  /** 操作结果 */
  result_list: z.array(z.object({ userid: z.string(), department_id: z.number(), errcode: z.number(), errmsg: z.string() })).optional(),
});
export type DeleteServiceUserResponse = z.infer<typeof DeleteServiceUserResponseSchema>;

/**
 * 获取接待人员列表
 * @see https://developer.work.weixin.qq.com/document/path/94724
 */
export const ListServicerRequestSchema = z.object({
  /** 客服账号ID */
  open_kfid: z.string(),
});
export type ListServicerRequest = z.infer<typeof ListServicerRequestSchema>;
export const ListServicerResponseSchema = z.object({
  /** 客服账号的接待人员列表 */
  servicer_list: z.array(z.object({ userid: z.string(), status: z.number(), stop_type: z.number(), department_id: z.array(z.number()) })).optional(),
});
export type ListServicerResponse = z.infer<typeof ListServicerResponseSchema>;

/**
 * 接收消息和事件
 * @see https://developer.work.weixin.qq.com/document/path/94670
 */
export const SyncMsgRequestSchema = z.object({
  /** 上一次调用时返回的next_cursor，第一次拉取可以不填。若不填，从3天内最早的消息开始返回 */
  cursor: z.string().max(64).optional(),
  /** 回调事件返回的token字段，10分钟内有效；可不填，如果不填接口有严格的频率限制 */
  token: z.string().max(128).optional(),
  /** 期望请求的数据量，默认值和最大值都为1000 */
  limit: z.number().min(1).max(1000).default(1000).optional(),
  /** 语音消息类型，0-Amr 1-Silk，默认0 (0-Amr, 1-Silk) */
  voice_format: z.number().optional(),
  /** 指定拉取某个客服账号的消息 */
  open_kfid: z.string(),
});
export type SyncMsgRequest = z.infer<typeof SyncMsgRequestSchema>;
export const SyncMsgResponseSchema = z.object({
  /** 下次调用带上该值，则从当前的位置继续往后拉 */
  next_cursor: z.string().optional(),
  /** 是否还有更多数据。0-否；1-是 (0-否, 1-是) */
  has_more: z.number().optional(),
  /** 消息列表 */
  msg_list: z.array(z.object({ msgid: z.string(), open_kfid: z.string(), external_userid: z.string(), send_time: z.number(), origin: z.number(), servicer_userid: z.string(), msgtype: z.string() })).optional(),
});
export type SyncMsgResponse = z.infer<typeof SyncMsgResponseSchema>;

