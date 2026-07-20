// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 配置客户联系「联系我」方式
 * @see https://developer.work.weixin.qq.com/document/path/92228
 */
export const AddContactWayRequestSchema = z.object({
  /** 联系方式类型，1-单人，2-多人 (1-单人, 2-多人) */
  type: z.number(),
  /** 场景，1-在小程序中联系，2-通过二维码联系 (1-在小程序中联系, 2-通过二维码联系) */
  scene: z.number(),
  /** 在小程序中联系时使用的控件样式 */
  style: z.number().optional(),
  /** 联系方式的备注信息，用于助记 */
  remark: z.string().max(30).optional(),
  /** 外部客户添加时是否无需验证 */
  skip_verify: z.boolean().default(true).optional(),
  /** 企业自定义的state参数，用于区分不同的添加渠道 */
  state: z.string().max(30).optional(),
  /** 使用该联系方式的用户userID列表，在type为1时为必填，且只能有一个 */
  user: z.array(z.string()).optional(),
  /** 使用该联系方式的部门id列表，只在type为2时有效 */
  party: z.array(z.number()).optional(),
  /** 是否临时会话模式，true表示使用临时会话模式 */
  is_temp: z.boolean().default(false).optional(),
  /** 临时会话二维码有效期，以秒为单位。该参数仅在is_temp为true时有效 [timestamp] */
  expires_in: z.number().min(0).max(1209600).default(604800).optional(),
  /** 临时会话有效期，以秒为单位。该参数仅在is_temp为true时有效 [timestamp] */
  chat_expires_in: z.number().min(0).max(1209600).default(86400).optional(),
  /** 可进行临时会话的客户unionid，该参数仅在is_temp为true时有效 */
  unionid: z.string().optional(),
  /** 是否开启同一外部企业客户只能添加同一个员工 */
  is_exclusive: z.boolean().default(false).optional(),
  /** 是否标记客户添加来源为该应用创建的「联系我」 */
  mark_source: z.boolean().default(true).optional(),
  /** 结束语，会话结束时自动发送给客户 */
  conclusions: z.object({ text: z.object({ content: z.string().max(4000) }), image: z.object({ media_id: z.string(), pic_url: z.string() }), link: z.object({ title: z.string().max(128), picurl: z.string(), desc: z.string().max(512), url: z.string() }), miniprogram: z.object({ title: z.string().max(64), pic_media_id: z.string(), appid: z.string(), page: z.string() }) }).optional(),
});
export type AddContactWayRequest = z.infer<typeof AddContactWayRequestSchema>;
export const AddContactWayResponseSchema = z.object({
  /** 新增联系方式的配置id */
  config_id: z.string().optional(),
  /** 联系我二维码链接，仅在scene为2时返回 */
  qr_code: z.string().optional(),
});
export type AddContactWayResponse = z.infer<typeof AddContactWayResponseSchema>;

/**
 * 添加企业客户标签
 * @see https://developer.work.weixin.qq.com/document/path/92563
 */
export const AddCorpTagRequestSchema = z.object({
  /** 标签组id，如果要向指定的标签组下添加标签需填写 */
  group_id: z.string().optional(),
  /** 标签组名称，最长为30个字符。如果填写了group_id则此参数被忽略 */
  group_name: z.string().max(30).optional(),
  /** 标签组次序值。order值大的排序靠前。有效的值范围是[0, 2^32) */
  order: z.number().min(0).max(4294967295).optional(),
  /** 标签列表，每个企业最多可配置10000个企业标签 */
  tag: z.array(z.object({ name: z.string().min(1).max(30), order: z.number().min(0).max(4294967295) })).optional(),
  /** 授权方安装的应用agentid。仅旧的第三方多应用套件需要填此参数 */
  agentid: z.number().optional(),
});
export type AddCorpTagRequest = z.infer<typeof AddCorpTagRequestSchema>;
export const AddCorpTagResponseSchema = z.object({
  /** 标签组信息 */
  tag_group: z.object({ group_id: z.string(), group_name: z.string(), create_time: z.number(), order: z.number(), tag: z.array(z.object({ id: z.string(), name: z.string(), create_time: z.number(), order: z.number() })) }).optional(),
});
export type AddCorpTagResponse = z.infer<typeof AddCorpTagResponseSchema>;

/**
 * 新建敏感词规则
 * @see https://developer.work.weixin.qq.com/document/path/95100
 */
export const AddInterceptRuleRequestSchema = z.object({
  /** 规则名称，长度1~20个utf8字符 */
  rule_name: z.string().min(1).max(20),
  /** 敏感词列表，敏感词长度1~32个utf8字符，列表大小不能超过300个 */
  word_list: z.array(z.string()),
  /** 额外的拦截语义规则，1：手机号、2：邮箱地址、3：红包 (1-手机号, 2-邮箱地址, 3-红包) */
  semantics_list: z.number().optional(),
  /** 拦截方式，1:警告并拦截发送；2:仅发警告 (1-警告并拦截发送, 2-仅发警告) */
  intercept_type: z.number(),
  /** 敏感词适用范围，userid与department不能同时为不填 */
  applicable_range: z.object({ user_list: z.array(z.string()), department_list: z.array(z.number()) }),
});
export type AddInterceptRuleRequest = z.infer<typeof AddInterceptRuleRequestSchema>;
export const AddInterceptRuleResponseSchema = z.object({
  /** 规则id */
  rule_id: z.string().optional(),
});
export type AddInterceptRuleResponse = z.infer<typeof AddInterceptRuleResponseSchema>;

/**
 * 企业发表内容到客户的朋友圈
 * @see https://developer.work.weixin.qq.com/document/path/95173
 */
export const AddMomentTaskRequestSchema = z.object({
  /** 指定的发表范围；若未指定，则表示执行者为应用可见范围内所有成员 */
  visible_range: z.object({ sender_list: z.object({ user_list: z.array(z.string()), department_list: z.array(z.number()) }), external_contact_list: z.object({ tag_list: z.array(z.string()) }) }).optional(),
  /** 文本消息 */
  text: z.object({ content: z.string().max(4000) }).optional(),
  /** 附件，不能与text.content同时为空，最多支持9个图片类型，或者1个视频，或者1个链接。类型只能三选一 */
  attachments: z.array(z.object({ msgtype: z.string(), image: z.object({ media_id: z.string() }), link: z.object({ title: z.string().max(128), url: z.string(), media_id: z.string() }), video: z.object({ media_id: z.string() }) })).optional(),
});
export type AddMomentTaskRequest = z.infer<typeof AddMomentTaskRequestSchema>;
export const AddMomentTaskResponseSchema = z.object({
  /** 异步任务id，最大长度为64字节，24小时有效 */
  jobid: z.string().optional(),
});
export type AddMomentTaskResponse = z.infer<typeof AddMomentTaskResponseSchema>;

/**
 * 创建企业群发
 * @see https://developer.work.weixin.qq.com/document/path/93537
 */
export const AddMessageTemplateRequestSchema = z.object({
  /** 群发任务的类型，single表示发送给客户，group表示发送给客户群 (single-发送给客户, group-发送给客户群) */
  chat_type: z.string().optional(),
  /** 客户的externaluserid列表，仅在chat_type为single时有效 */
  external_userid: z.array(z.string()).optional(),
  /** 客户群id列表，仅在chat_type为group时有效 */
  chat_id_list: z.array(z.string()).optional(),
  /** 群发客户标签筛选条件 */
  tag_filter: z.object({ group_list: z.array(z.object({ tag_list: z.array(z.string()) })) }).optional(),
  /** 发送企业群发消息的成员userid，chat_type为group时必填 */
  sender: z.string().optional(),
  /** 是否允许成员在待发送客户列表中重新进行选择，仅支持客户群发场景 (true-允许, false-不允许) */
  allow_select: z.boolean().optional(),
  /** 文本消息内容 */
  text: z.object({ content: z.string().max(4000) }).optional(),
  /** 附件列表，最多支持9个 */
  attachments: z.array(z.object({ msgtype: z.string(), image: z.object({ media_id: z.string(), pic_url: z.string() }), link: z.object({ title: z.string().max(128), picurl: z.string().max(2048), desc: z.string().max(512), url: z.string().max(2048) }), miniprogram: z.object({ title: z.string().max(64), pic_media_id: z.string(), appid: z.string(), page: z.string() }), video: z.object({ media_id: z.string() }), file: z.object({ media_id: z.string() }) })).optional(),
});
export type AddMessageTemplateRequest = z.infer<typeof AddMessageTemplateRequestSchema>;
export const AddMessageTemplateResponseSchema = z.object({
  /** 无效或无法发送的external_userid或chatid列表 */
  fail_list: z.array(z.string()).optional(),
  /** 企业群发消息的id */
  msgid: z.string().optional(),
});
export type AddMessageTemplateResponse = z.infer<typeof AddMessageTemplateResponseSchema>;

/**
 * 创建商品图册
 * @see https://developer.work.weixin.qq.com/document/path/95101
 */
export const AddProductAlbumRequestSchema = z.object({
  /** 商品的名称、特色等 */
  description: z.string().max(300),
  /** 商品的价格，单位为分 */
  price: z.number().max(500000),
  /** 商品编码；只能输入数字和字母 */
  product_sn: z.string().max(128).optional(),
  /** 附件类型，仅支持image */
  attachments: z.array(z.object({ type: z.string(), image: z.object({ media_id: z.string() }) })),
});
export type AddProductAlbumRequest = z.infer<typeof AddProductAlbumRequestSchema>;
export const AddProductAlbumResponseSchema = z.object({
  /** 商品id */
  product_id: z.string().optional(),
});
export type AddProductAlbumResponse = z.infer<typeof AddProductAlbumResponseSchema>;

/**
 * 批量获取客户详情
 * @see https://developer.work.weixin.qq.com/document/path/92994
 */
export const BatchGetByUserRequestSchema = z.object({
  /** 企业成员的userid列表，字符串类型 */
  userid_list: z.array(z.string()),
  /** 用于分页查询的游标，由上一次调用返回 */
  cursor: z.string().min(0).optional(),
  /** 返回的最大记录数 */
  limit: z.number().min(1).max(100).default(50).optional(),
});
export type BatchGetByUserRequest = z.infer<typeof BatchGetByUserRequestSchema>;
export const BatchGetByUserResponseSchema = z.object({
  /** 客户列表 */
  external_contact_list: z.array(z.object({ external_contact: z.object({ external_userid: z.string(), name: z.string(), position: z.string(), avatar: z.string(), corp_name: z.string(), corp_full_name: z.string(), type: z.number(), gender: z.number(), unionid: z.string(), external_profile: z.object({ external_attr: z.array(z.object({ type: z.number(), name: z.string(), text: z.object({ value: z.string() }), web: z.object({ url: z.string(), title: z.string() }), miniprogram: z.object({ appid: z.string(), pagepath: z.string(), title: z.string() }) })) }) }), follow_info: z.object({ userid: z.string(), remark: z.string(), description: z.string(), createtime: z.number(), tag_id: z.array(z.string()), remark_corp_name: z.string(), remark_mobiles: z.array(z.string()), oper_userid: z.string(), add_way: z.number(), wechat_channels: z.object({ nickname: z.string(), source: z.number() }) }) })).optional(),
  /** 分页游标，下次请求时填写以获取后续记录 */
  next_cursor: z.string().min(0).optional(),
  /** 失败信息 */
  fail_info: z.object({ unlicensed_userid_list: z.array(z.string()) }).optional(),
});
export type BatchGetByUserResponse = z.infer<typeof BatchGetByUserResponseSchema>;

/**
 * 停止企业群发
 * @see https://developer.work.weixin.qq.com/document/path/97611
 */
export const CancelGroupMsgSendRequestSchema = z.object({
  /** 群发消息的id，通过获取群发记录列表接口返回 */
  msgid: z.string().min(1),
});
export type CancelGroupMsgSendRequest = z.infer<typeof CancelGroupMsgSendRequestSchema>;

/**
 * 停止发表企业朋友圈
 * @see https://developer.work.weixin.qq.com/document/path/97612
 */
export const CancelMomentTaskRequestSchema = z.object({
  /** 朋友圈id，可通过获取客户朋友圈企业发表的列表接口获取朋友圈企业发表的列表 */
  moment_id: z.string(),
});
export type CancelMomentTaskRequest = z.infer<typeof CancelMomentTaskRequestSchema>;

/**
 * 获取已服务的外部联系人
 * @see https://developer.work.weixin.qq.com/document/path/99445
 */
export const ListExternalContactRequestSchema = z.object({
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().optional(),
  /** 返回的最大记录数，整型，默认为1000 */
  limit: z.number().min(1).max(2000).default(1000).optional(),
});
export type ListExternalContactRequest = z.infer<typeof ListExternalContactRequestSchema>;
export const ListExternalContactResponseSchema = z.object({
  /** 外部联系人列表 */
  info_list: z.array(z.object({ is_customer: z.boolean(), tmp_openid: z.string(), external_userid: z.string(), name: z.string(), follow_userid: z.string(), chat_id: z.string(), chat_name: z.string(), add_time: z.number() })).optional(),
  /** 分页游标，再下次请求时填写以获取之后分页的记录，如果已经没有更多的数据则返回空，有效期为4小时 */
  next_cursor: z.string().optional(),
});
export type ListExternalContactResponse = z.infer<typeof ListExternalContactResponseSchema>;

export const GetCustomerAcquisitionQuotaResponseSchema = z.object({
  /** 历史累计使用量 */
  total: z.number().optional(),
  /** 剩余使用量 */
  balance: z.number().optional(),
  /** 额度列表 */
  quota_list: z.array(z.record(z.string(), z.any())).optional(),
  /** 额度过期时间戳，为过期日的零点 */
  expire_date: z.number().optional(),
});
export type GetCustomerAcquisitionQuotaResponse = z.infer<typeof GetCustomerAcquisitionQuotaResponseSchema>;

/**
 * 获取获客客户列表
 * @see https://developer.work.weixin.qq.com/document/path/97305
 */
export const ListCustomerAcquisitionRequestSchema = z.object({
  /** 获客链接id。需要是当前应用创建 */
  link_id: z.string(),
  /** 返回的最大记录数，整型 */
  limit: z.number().max(1000).optional(),
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().optional(),
});
export type ListCustomerAcquisitionRequest = z.infer<typeof ListCustomerAcquisitionRequestSchema>;
export const ListCustomerAcquisitionResponseSchema = z.object({
  /** 客户列表 */
  customer_list: z.array(z.object({ external_userid: z.string(), userid: z.string(), chat_status: z.number(), state: z.string().max(64) })).optional(),
  /** 分页游标，再下次请求时填写以获取之后分页的记录，如果已经没有更多的数据则返回空 */
  next_cursor: z.string().optional(),
});
export type ListCustomerAcquisitionResponse = z.infer<typeof ListCustomerAcquisitionResponseSchema>;

/**
 * 获取成员多次收消息详情
 * @see https://developer.work.weixin.qq.com/document/path/100254
 */
export const GetCustomerAcquisitionChatInfoRequestSchema = z.object({
  /** 成员多次收消息事件中回调的会话信息凭据ChatKey，回调后30分钟内有效 */
  chat_key: z.string().min(1),
});
export type GetCustomerAcquisitionChatInfoRequest = z.infer<typeof GetCustomerAcquisitionChatInfoRequestSchema>;
export const GetCustomerAcquisitionChatInfoResponseSchema = z.object({
  /** 成员的userid */
  userid: z.string().optional(),
  /** 客户id */
  external_userid: z.string().optional(),
  /** 会话信息详情 */
  chat_info: z.object({ recv_msg_cnt: z.number(), link_id: z.string(), state: z.string() }).optional(),
});
export type GetCustomerAcquisitionChatInfoResponse = z.infer<typeof GetCustomerAcquisitionChatInfoResponseSchema>;

/**
 * 获取客户详情
 * @see https://developer.work.weixin.qq.com/document/path/92114
 */
export const GetExternalContactRequestSchema = z.object({
  /** 外部联系人的userid，注意不是企业成员的账号 */
  external_userid: z.string().min(1),
  /** 上次请求返回的next_cursor，用于分页 */
  cursor: z.string().min(1).optional(),
});
export type GetExternalContactRequest = z.infer<typeof GetExternalContactRequestSchema>;
export const GetExternalContactResponseSchema = z.object({
  /** 外部联系人详情对象 */
  external_contact: z.object({ external_userid: z.string(), name: z.string(), position: z.string(), avatar: z.string(), corp_name: z.string(), corp_full_name: z.string(), type: z.number(), gender: z.number(), unionid: z.string(), external_profile: z.object({ external_attr: z.array(z.object({ type: z.number(), name: z.string(), text: z.object({ value: z.string() }), web: z.object({ url: z.string(), title: z.string() }), miniprogram: z.object({ appid: z.string(), pagepath: z.string(), title: z.string() }) })) }) }).optional(),
  /** 跟进人列表 */
  follow_user: z.array(z.object({ userid: z.string(), remark: z.string(), description: z.string(), createtime: z.number(), tags: z.array(z.object({ group_name: z.string(), tag_name: z.string(), tag_id: z.string(), type: z.number() })), remark_corp_name: z.string(), remark_mobiles: z.array(z.string()), oper_userid: z.string(), add_way: z.number(), wechat_channels: z.object({ nickname: z.string(), source: z.number() }), state: z.string() })).optional(),
  /** 分页的cursor，当跟进人多于500人时返回 */
  next_cursor: z.string().optional(),
});
export type GetExternalContactResponse = z.infer<typeof GetExternalContactResponseSchema>;

export const GetFollowUserListResponseSchema = z.object({
  /** 配置了客户联系功能的成员userid列表 */
  follow_user: z.array(z.string()).optional(),
});
export type GetFollowUserListResponse = z.infer<typeof GetFollowUserListResponseSchema>;

/**
 * 获取企业的全部群发记录
 * @see https://developer.work.weixin.qq.com/document/path/93539
 */
export const ListGroupMsgRequestSchema = z.object({
  /** 群发任务的类型，single表示发送给客户，group表示发送给客户群 (single-发送给客户, group-发送给客户群) */
  chat_type: z.string(),
  /** 群发任务记录开始时间 [timestamp] */
  start_time: z.number(),
  /** 群发任务记录结束时间 [timestamp] */
  end_time: z.number(),
  /** 群发任务创建人企业账号id */
  creator: z.string().max(64).optional(),
  /** 创建人类型。0：企业发表 1：个人发表 2：所有，包括个人创建以及企业创建 (0-企业发表, 1-个人发表, 2-所有) */
  filter_type: z.number().optional(),
  /** 返回的最大记录数 */
  limit: z.number().max(100).default(50).optional(),
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().max(1024).optional(),
});
export type ListGroupMsgRequest = z.infer<typeof ListGroupMsgRequestSchema>;
export const ListGroupMsgResponseSchema = z.object({
  /** 分页游标，再下次请求时填写以获取之后分页的记录，如果已经没有更多的数据则返回空 */
  next_cursor: z.string().optional(),
  /** 群发记录列表 */
  group_msg_list: z.array(z.object({ msgid: z.string(), creator: z.string(), create_time: z.string(), create_type: z.number(), text: z.object({ content: z.string() }), attachments: z.array(z.object({ msgtype: z.string(), image: z.object({ media_id: z.string(), pic_url: z.string() }), link: z.object({ title: z.string(), picurl: z.string(), desc: z.string(), url: z.string() }), miniprogram: z.object({ title: z.string(), appid: z.string(), page: z.string() }), video: z.object({ media_id: z.string() }), file: z.object({ media_id: z.string() }) })) })).optional(),
});
export type ListGroupMsgResponse = z.infer<typeof ListGroupMsgResponseSchema>;

/**
 * 获取客户朋友圈全部的发表记录
 * @see https://developer.work.weixin.qq.com/document/path/93545
 */
export const ListMomentRequestSchema = z.object({
  /** 朋友圈记录开始时间。Unix时间戳 [timestamp] */
  start_time: z.number(),
  /** 朋友圈记录结束时间。Unix时间戳 [timestamp] */
  end_time: z.number(),
  /** 朋友圈创建人的userid */
  creator: z.string().min(1).max(64).optional(),
  /** 朋友圈类型。0：企业发表 1：个人发表 2：所有，包括个人创建以及企业创建，默认情况下为所有类型 (0-企业发表, 1-个人发表, 2-所有) */
  filter_type: z.number().optional(),
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().min(0).optional(),
  /** 返回的最大记录数，整型，最大值20，默认值20，超过最大值时取默认值 */
  limit: z.number().max(20).default(20).optional(),
});
export type ListMomentRequest = z.infer<typeof ListMomentRequestSchema>;
export const ListMomentResponseSchema = z.object({
  /** 分页游标，下次请求时填写以获取之后分页的记录，如果已经没有更多的数据则返回空 */
  next_cursor: z.string().optional(),
  /** 朋友圈列表 */
  moment_list: z.array(z.object({ moment_id: z.string(), creator: z.string(), create_time: z.number(), create_type: z.number(), visible_type: z.number(), text: z.object({ content: z.string() }), image: z.array(z.object({ media_id: z.string() })), video: z.object({ media_id: z.string(), thumb_media_id: z.string() }), link: z.object({ title: z.string(), url: z.string() }), location: z.object({ latitude: z.string(), longitude: z.string(), name: z.string() }) })).optional(),
});
export type ListMomentResponse = z.infer<typeof ListMomentResponseSchema>;

/**
 * 管理企业规则组下的客户标签
 * @see https://developer.work.weixin.qq.com/document/path/94882
 */
export const GetStrategyTagListRequestSchema = z.object({
  /** 规则组id */
  strategy_id: z.number().optional(),
  /** 要查询的标签id */
  tag_id: z.array(z.string()).optional(),
  /** 要查询的标签组id，返回该标签组以及其下的所有标签信息 */
  group_id: z.array(z.string()).optional(),
});
export type GetStrategyTagListRequest = z.infer<typeof GetStrategyTagListRequestSchema>;
export const GetStrategyTagListResponseSchema = z.object({
  /** 标签组列表 */
  tag_group: z.array(z.object({ group_id: z.string(), group_name: z.string(), create_time: z.number(), order: z.number(), strategy_id: z.number(), tag: z.array(z.object({ id: z.string(), name: z.string(), create_time: z.number(), order: z.number() })) })).optional(),
});
export type GetStrategyTagListResponse = z.infer<typeof GetStrategyTagListResponseSchema>;

/**
 * 获取待分配的离职成员列表
 * @see https://developer.work.weixin.qq.com/document/path/94091
 */
export const GetUnassignedListRequestSchema = z.object({
  /** 分页查询游标，字符串类型，适用于数据量较大的情况，如果使用该参数则无需填写page_id，该参数由上一次调用返回 */
  cursor: z.string().optional(),
  /** 每次返回的最大记录数，默认为1000，最大值为1000 */
  page_size: z.number().min(1).max(1000).default(1000).optional(),
});
export type GetUnassignedListRequest = z.infer<typeof GetUnassignedListRequestSchema>;
export const GetUnassignedListResponseSchema = z.object({
  /** 离职成员的客户列表 */
  info: z.array(z.object({ handover_userid: z.string(), external_userid: z.string(), dimission_time: z.number() })).optional(),
  /** 是否是最后一条记录 */
  is_last: z.boolean().optional(),
  /** 分页查询游标，已经查完则返回空("")，使用page_id作为查询参数时不返回 */
  next_cursor: z.string().optional(),
});
export type GetUnassignedListResponse = z.infer<typeof GetUnassignedListResponseSchema>;

/**
 * 获取「联系客户统计」数据
 * @see https://developer.work.weixin.qq.com/document/path/93557
 */
export const GetUserBehaviorDataRequestSchema = z.object({
  /** 成员ID列表，最多100个 */
  userid: z.array(z.string()).optional(),
  /** 部门ID列表，最多100个 */
  partyid: z.array(z.number()).optional(),
  /** 数据起始时间，Unix时间戳 [timestamp] */
  start_time: z.number(),
  /** 数据结束时间，Unix时间戳 [timestamp] */
  end_time: z.number(),
});
export type GetUserBehaviorDataRequest = z.infer<typeof GetUserBehaviorDataRequestSchema>;
export const GetUserBehaviorDataResponseSchema = z.object({
  /** 行为数据列表 */
  behavior_data: z.array(z.object({ stat_time: z.number(), chat_cnt: z.number(), message_cnt: z.number(), reply_percentage: z.string(), avg_reply_time: z.number(), negative_feedback_cnt: z.number(), new_apply_cnt: z.number(), new_contact_cnt: z.number() })).optional(),
});
export type GetUserBehaviorDataResponse = z.infer<typeof GetUserBehaviorDataResponseSchema>;

/**
 * 添加入群欢迎语素材
 * @see https://developer.work.weixin.qq.com/document/path/93353
 */
export const AddGroupWelcomeTemplateRequestSchema = z.object({
  /** 文本消息对象 */
  text: z.object({ content: z.string().max(3000) }).optional(),
  /** 图片消息对象，media_id和pic_url只需填写一个，两者同时填写时使用media_id，二者不可同时为空 */
  image: z.object({ media_id: z.string().min(1), pic_url: z.string().min(1) }).optional(),
  /** 图文消息对象 */
  link: z.object({ title: z.string().min(1).max(128), picurl: z.string().min(1), desc: z.string().min(1).max(512), url: z.string().min(1) }).optional(),
  /** 小程序消息对象 */
  miniprogram: z.object({ title: z.string().min(1).max(64), pic_media_id: z.string().min(1), appid: z.string().min(1), page: z.string().min(1) }).optional(),
  /** 文件消息对象 */
  file: z.object({ media_id: z.string().min(1) }).optional(),
  /** 视频消息对象 */
  video: z.object({ media_id: z.string().min(1) }).optional(),
  /** 授权方安装的应用agentid。仅旧的第三方多应用套件需要填此参数 */
  agentid: z.number().optional(),
  /** 是否通知成员将这条入群欢迎语应用到客户群中，0-不通知，1-通知，不填则通知 (0-不通知, 1-通知) */
  notify: z.number().optional(),
});
export type AddGroupWelcomeTemplateRequest = z.infer<typeof AddGroupWelcomeTemplateRequestSchema>;
export const AddGroupWelcomeTemplateResponseSchema = z.object({
  /** 欢迎语素材id */
  template_id: z.string().optional(),
});
export type AddGroupWelcomeTemplateResponse = z.infer<typeof AddGroupWelcomeTemplateResponseSchema>;

/**
 * 配置客户群进群方式
 * @see https://developer.work.weixin.qq.com/document/path/92569
 */
export const AddJoinWayRequestSchema = z.object({
  /** 场景。1 - 群的小程序插件，2 - 群的二维码插件 (1-群的小程序插件, 2-群的二维码插件) */
  scene: z.number(),
  /** 联系方式的备注信息，用于助记，超过30个字符将被截断 */
  remark: z.string().max(30).optional(),
  /** 当群满了后，是否自动新建群。0-否；1-是。默认为1 (0-否, 1-是) */
  auto_create_room: z.number().optional(),
  /** 自动建群的群名前缀，当auto_create_room为1时有效。最长40个utf8字符 */
  room_base_name: z.string().max(40).optional(),
  /** 自动建群的群起始序号，当auto_create_room为1时有效 */
  room_base_id: z.number().optional(),
  /** 使用该配置的客户群ID列表，最多支持5个 */
  chat_id_list: z.array(z.string()),
  /** 企业自定义的state参数，用于区分不同的入群渠道。不超过30个UTF-8字符 */
  state: z.string().max(30).optional(),
  /** 是否标记客户添加来源为该应用创建的「加入群聊」, 默认值为true; 仅对「营销获客」应用生效 */
  mark_source: z.boolean().default(true).optional(),
});
export type AddJoinWayRequest = z.infer<typeof AddJoinWayRequestSchema>;
export const AddJoinWayResponseSchema = z.object({
  /** 配置id */
  config_id: z.string().optional(),
});
export type AddJoinWayResponse = z.infer<typeof AddJoinWayResponseSchema>;

/**
 * 获取客户群详情
 * @see https://developer.work.weixin.qq.com/document/path/92122
 */
export const GetGroupChatRequestSchema = z.object({
  /** 客户群ID */
  chat_id: z.string(),
  /** 是否需要返回群成员的名字。0-不返回；1-返回。默认不返回 (0-不返回, 1-返回) */
  need_name: z.number().optional(),
});
export type GetGroupChatRequest = z.infer<typeof GetGroupChatRequestSchema>;
export const GetGroupChatResponseSchema = z.object({
  /** 客户群详情 */
  group_chat: z.object({ chat_id: z.string(), name: z.string(), owner: z.string(), create_time: z.number(), notice: z.string(), member_list: z.array(z.object({ userid: z.string(), type: z.number(), unionid: z.string(), join_time: z.number(), join_scene: z.number(), invitor: z.object({ userid: z.string() }), group_nickname: z.string(), name: z.string() })), admin_list: z.array(z.object({ userid: z.string() })), member_version: z.string() }).optional(),
});
export type GetGroupChatResponse = z.infer<typeof GetGroupChatResponseSchema>;

/**
 * 获取客户群列表
 * @see https://developer.work.weixin.qq.com/document/path/92120
 */
export const ListGroupChatRequestSchema = z.object({
  /** 客户群跟进状态过滤。0-所有列表(即不过滤),1-离职待继承,2-离职继承中,3-离职继承完成 (0-所有列表(即不过滤), 1-离职待继承, 2-离职继承中, 3-离职继承完成) */
  status_filter: z.number().optional(),
  /** 群主过滤。如果不填，表示获取应用可见范围内全部群主的数据 */
  owner_filter: z.object({ userid_list: z.array(z.string()) }).optional(),
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用不填 */
  cursor: z.string().optional(),
  /** 分页，预期请求的数据量 */
  limit: z.number().min(1).max(1000),
});
export type ListGroupChatRequest = z.infer<typeof ListGroupChatRequestSchema>;
export const ListGroupChatResponseSchema = z.object({
  /** 客户群列表 */
  group_chat_list: z.array(z.object({ chat_id: z.string(), status: z.number() })).optional(),
  /** 分页游标，下次请求时填写以获取之后分页的记录。如果该字段返回空则表示已没有更多数据 */
  next_cursor: z.string().optional(),
});
export type ListGroupChatResponse = z.infer<typeof ListGroupChatResponseSchema>;

/**
 * 分配在职成员的客户群
 * @see https://developer.work.weixin.qq.com/document/path/95703
 */
export const TransferGroupChatOwnerRequestSchema = z.object({
  /** 需要转群主的客户群ID列表 */
  chat_id_list: z.array(z.string()),
  /** 新群主ID */
  new_owner: z.string().min(1).max(64),
});
export type TransferGroupChatOwnerRequest = z.infer<typeof TransferGroupChatOwnerRequestSchema>;
export const TransferGroupChatOwnerResponseSchema = z.object({
  /** 没能成功继承的群列表 */
  failed_chat_list: z.array(z.object({ chat_id: z.string().min(1), errcode: z.number(), errmsg: z.string().min(1) })).optional(),
});
export type TransferGroupChatOwnerResponse = z.infer<typeof TransferGroupChatOwnerResponseSchema>;

/**
 * 获取「群聊数据统计」数据（按群主聚合）
 * @see https://developer.work.weixin.qq.com/document/path/93559
 */
export const GetGroupChatStatisticRequestSchema = z.object({
  /** 起始日期的时间戳，填当天的0时0分0秒。取值范围：昨天至前180天 [timestamp] */
  day_begin_time: z.number(),
  /** 结束日期的时间戳，填当天的0时0分0秒。如果不填，默认同 day_begin_time。取值范围：昨天至前180天 [timestamp] */
  day_end_time: z.number().default('同 day_begin_time').optional(),
  /** 群主过滤对象。如果不填，表示获取应用可见范围内全部群主的数据 */
  owner_filter: z.object({ userid_list: z.array(z.string()) }),
  /** 排序方式。1-新增群的数量，2-群总数，3-新增群人数，4-群总人数 (1-新增群的数量, 2-群总数, 3-新增群人数, 4-群总人数) */
  order_by: z.number().optional(),
  /** 是否升序。0-否（默认降序）；1-是 (0-否, 1-是) */
  order_asc: z.number().optional(),
  /** 分页，偏移量 */
  offset: z.number().min(0).default(0).optional(),
  /** 分页，预期请求的数据量 */
  limit: z.number().min(1).max(1000).default(500).optional(),
});
export type GetGroupChatStatisticRequest = z.infer<typeof GetGroupChatStatisticRequestSchema>;
export const GetGroupChatStatisticResponseSchema = z.object({
  /** 命中过滤条件的记录总个数 */
  total: z.number().optional(),
  /** 当前分页的下一个offset。当next_offset和total相等时，说明已经取完所有 */
  next_offset: z.number().optional(),
  /** 记录列表。表示某个群主所拥有的客户群的统计数据 */
  items: z.array(z.object({ owner: z.string(), data: z.object({ new_chat_cnt: z.number(), chat_total: z.number(), chat_has_msg: z.number(), new_member_cnt: z.number(), member_total: z.number(), member_has_msg: z.number(), msg_total: z.number(), migrate_trainee_chat_cnt: z.number() }) })).optional(),
});
export type GetGroupChatStatisticResponse = z.infer<typeof GetGroupChatStatisticResponseSchema>;

/**
 * 分配离职成员的客户群
 * @see https://developer.work.weixin.qq.com/document/path/93542
 */
export const TransferGroupChatRequestSchema = z.object({
  /** 需要转群主的客户群ID列表 */
  chat_id_list: z.array(z.string()),
  /** 新群主ID */
  new_owner: z.string().min(1).max(64),
});
export type TransferGroupChatRequest = z.infer<typeof TransferGroupChatRequestSchema>;
export const TransferGroupChatResponseSchema = z.object({
  /** 没能成功继承的群 */
  failed_chat_list: z.array(z.object({ chat_id: z.string(), errcode: z.number(), errmsg: z.string() })).optional(),
});
export type TransferGroupChatResponse = z.infer<typeof TransferGroupChatResponseSchema>;

/**
 * 编辑客户企业标签
 * @see https://developer.work.weixin.qq.com/document/path/92118
 */
export const MarkTagExternalContactRequestSchema = z.object({
  /** 添加外部联系人的userid */
  userid: z.string().min(1).max(64),
  /** 外部联系人userid */
  external_userid: z.string().min(1).max(64),
  /** 要标记的标签列表 */
  add_tag: z.array(z.string()).optional(),
  /** 要移除的标签列表 */
  remove_tag: z.array(z.string()).optional(),
});
export type MarkTagExternalContactRequest = z.infer<typeof MarkTagExternalContactRequestSchema>;

/**
 * 获取规则组列表
 * @see https://developer.work.weixin.qq.com/document/path/94891
 */
export const ListMomentStrategyRequestSchema = z.object({
  /** 分页查询游标，首次调用可不填 */
  cursor: z.string().optional(),
  /** 分页大小，默认为1000，最大不超过1000 */
  limit: z.number().max(1000).default(1000).optional(),
});
export type ListMomentStrategyRequest = z.infer<typeof ListMomentStrategyRequestSchema>;
export const ListMomentStrategyResponseSchema = z.object({
  /** 规则组id列表 */
  strategy: z.array(z.object({ strategy_id: z.number() })).optional(),
  /** 分页游标，用于查询下一个分页的数据，无更多数据时不返回 */
  next_cursor: z.string().optional(),
});
export type ListMomentStrategyResponse = z.infer<typeof ListMomentStrategyResponseSchema>;

/**
 * 客户群opengid转换
 * @see https://developer.work.weixin.qq.com/document/path/94822
 */
export const OpenGidToChatIdRequestSchema = z.object({
  /** 小程序在微信获取到的群ID */
  opengid: z.string(),
});
export type OpenGidToChatIdRequest = z.infer<typeof OpenGidToChatIdRequestSchema>;
export const OpenGidToChatIdResponseSchema = z.object({
  /** 客户群ID，可以用来调用获取客户群详情 */
  chat_id: z.string().optional(),
});
export type OpenGidToChatIdResponse = z.infer<typeof OpenGidToChatIdResponseSchema>;

/**
 * 修改客户备注信息
 * @see https://developer.work.weixin.qq.com/document/path/92115
 */
export const RemarkExternalContactRequestSchema = z.object({
  /** 企业成员的userid */
  userid: z.string().min(1),
  /** 外部联系人userid */
  external_userid: z.string().min(1),
  /** 此用户对外部联系人的备注，最多20个字符 */
  remark: z.string().min(1).max(20).optional(),
  /** 此用户对外部联系人的描述，最多150个字符 */
  description: z.string().min(1).max(150).optional(),
  /** 此用户对外部联系人备注的所属公司名称，最多20个字符。只在此外部联系人为微信用户时有效 */
  remark_company: z.string().min(1).max(20).optional(),
  /** 此用户对外部联系人备注的手机号。如果要清除所有备注手机号，请填写一个空字符串("") */
  remark_mobiles: z.array(z.string()).optional(),
  /** 备注图片的mediaid */
  remark_pic_mediaid: z.string().min(1).optional(),
});
export type RemarkExternalContactRequest = z.infer<typeof RemarkExternalContactRequestSchema>;

/**
 * 提醒成员群发
 * @see https://developer.work.weixin.qq.com/document/path/97610
 */
export const RemindGroupMsgSendRequestSchema = z.object({
  /** 群发消息的id，通过获取群发记录列表接口返回 */
  msgid: z.string(),
});
export type RemindGroupMsgSendRequest = z.infer<typeof RemindGroupMsgSendRequestSchema>;

/**
 * 分配离职成员的客户
 * @see https://developer.work.weixin.qq.com/document/path/94081
 */
export const TransferCustomerResignedRequestSchema = z.object({
  /** 原跟进成员的userid */
  handover_userid: z.string().min(1).max(64),
  /** 接替成员的userid */
  takeover_userid: z.string().min(1).max(64),
  /** 客户的external_userid列表，最多一次转移100个客户 */
  external_userid: z.array(z.string()),
});
export type TransferCustomerResignedRequest = z.infer<typeof TransferCustomerResignedRequestSchema>;
export const TransferCustomerResignedResponseSchema = z.object({
  /** 分配结果列表 */
  customer: z.array(z.object({ external_userid: z.string(), errcode: z.number() })).optional(),
});
export type TransferCustomerResignedResponse = z.infer<typeof TransferCustomerResignedResponseSchema>;

/**
 * 查询客户接替状态
 * @see https://developer.work.weixin.qq.com/document/path/94090
 */
export const TransferResultResignedRequestSchema = z.object({
  /** 原添加成员的userid */
  handover_userid: z.string().min(1).max(64),
  /** 接替成员的userid */
  takeover_userid: z.string().min(1).max(64),
  /** 分页查询的cursor，每个分页返回的数据不会超过1000条；不填或为空表示获取第一个分页 */
  cursor: z.string().min(0).optional(),
});
export type TransferResultResignedRequest = z.infer<typeof TransferResultResignedRequestSchema>;
export const TransferResultResignedResponseSchema = z.object({
  /** 客户接替信息列表 */
  customer: z.array(z.object({ external_userid: z.string().min(1).max(64), status: z.number(), takeover_time: z.number().min(0).default(0) })).optional(),
  /** 下个分页的起始cursor */
  next_cursor: z.string().min(0).optional(),
});
export type TransferResultResignedResponse = z.infer<typeof TransferResultResignedResponseSchema>;

/**
 * 发送新客户欢迎语
 * @see https://developer.work.weixin.qq.com/document/path/92137
 */
export const SendWelcomeMessageRequestSchema = z.object({
  /** 通过添加外部联系人事件推送给企业的发送欢迎语的凭证，有效期为20秒 */
  welcome_code: z.string().min(1),
  /** 消息文本内容对象，最长为4000字节 */
  text: z.object({ content: z.string().min(1).max(4000) }).optional(),
  /** 附件列表，最多可添加9个附件。text和attachments不能同时为空 */
  attachments: z.array(z.object({ msgtype: z.string(), image: z.object({ media_id: z.string().min(1), pic_url: z.string().min(1) }), link: z.object({ title: z.string().min(1).max(128), picurl: z.string().min(1), desc: z.string().min(1).max(512), url: z.string().min(1) }), miniprogram: z.object({ title: z.string().min(1).max(64), pic_media_id: z.string().min(1), appid: z.string().min(1), page: z.string().min(1) }), video: z.object({ media_id: z.string().min(1) }), file: z.object({ media_id: z.string().min(1) }) })).optional(),
});
export type SendWelcomeMessageRequest = z.infer<typeof SendWelcomeMessageRequestSchema>;

/**
 * 分配在职成员的客户
 * @see https://developer.work.weixin.qq.com/document/path/92125
 */
export const TransferCustomerExternalContactRequestSchema = z.object({
  /** 原跟进成员的userid */
  handover_userid: z.string().min(1),
  /** 接替成员的userid */
  takeover_userid: z.string().min(1),
  /** 客户的external_userid列表，每次最多分配100个客户 */
  external_userid: z.array(z.string()),
  /** 转移成功后发给客户的消息，最多200个字符，不填则使用默认文案 */
  transfer_success_msg: z.string().min(1).max(200).optional(),
});
export type TransferCustomerExternalContactRequest = z.infer<typeof TransferCustomerExternalContactRequestSchema>;
export const TransferCustomerExternalContactResponseSchema = z.object({
  /** 客户分配结果列表 */
  customer: z.array(z.object({ external_userid: z.string(), errcode: z.number() })).optional(),
});
export type TransferCustomerExternalContactResponse = z.infer<typeof TransferCustomerExternalContactResponseSchema>;

/**
 * 查询客户接替状态
 * @see https://developer.work.weixin.qq.com/document/path/94089
 */
export const TransferResultExternalContactRequestSchema = z.object({
  /** 原添加成员的userid */
  handover_userid: z.string().min(1).max(64),
  /** 接替成员的userid */
  takeover_userid: z.string().min(1).max(64),
  /** 分页查询的cursor，每个分页返回的数据不会超过1000条；不填或为空表示获取第一个分页 */
  cursor: z.string().optional(),
});
export type TransferResultExternalContactRequest = z.infer<typeof TransferResultExternalContactRequestSchema>;
export const TransferResultExternalContactResponseSchema = z.object({
  /** 客户接替信息列表 */
  customer: z.array(z.object({ external_userid: z.string(), status: z.number(), takeover_time: z.number() })).optional(),
  /** 下个分页的起始cursor */
  next_cursor: z.string().optional(),
});
export type TransferResultExternalContactResponse = z.infer<typeof TransferResultExternalContactResponseSchema>;

/**
 * 上传附件资源
 * @see https://developer.work.weixin.qq.com/document/path/95105
 */
export const UploadAttachmentRequestSchema = z.object({
  /** 媒体文件类型 (image-图片, video-视频, file-普通文件) */
  media_type: z.string(),
  /** 附件类型 (1-朋友圈, 2-商品图册) */
  attachment_type: z.number(),
});
export type UploadAttachmentRequest = z.infer<typeof UploadAttachmentRequestSchema>;
export const UploadAttachmentResponseSchema = z.object({
  /** 媒体文件类型 (image-图片, video-视频, file-普通文件) */
  type: z.string().optional(),
  /** 媒体文件上传后获取的唯一标识，三天有效 */
  media_id: z.string().optional(),
  /** 媒体文件上传时间戳 [timestamp] */
  created_at: z.number().optional(),
});
export type UploadAttachmentResponse = z.infer<typeof UploadAttachmentResponseSchema>;

