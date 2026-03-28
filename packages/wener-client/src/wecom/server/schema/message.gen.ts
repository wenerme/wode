// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 创建群聊会话
 * @see https://developer.work.weixin.qq.com/document/path/90068
 */
export const CreateGroupChatRequestSchema = z.object({
  /** 群聊名，最多50个utf8字符，超过将截断 */
  name: z.string().max(50).optional(),
  /** 指定群主的id。如果不指定，系统会随机从userlist中选一人作为群主 */
  owner: z.string().max(64).optional(),
  /** 群成员id列表。至少2人，至多2000人 */
  userlist: z.array(z.string()),
  /** 群聊的唯一标志，不能与已有的群重复；字符串类型，最长32个字符。只允许字符0-9及字母a-zA-Z。如果不填，系统会随机生成群id */
  chatid: z.string().max(32).optional(),
});
export type CreateGroupChatRequest = z.infer<typeof CreateGroupChatRequestSchema>;
export const CreateGroupChatResponseSchema = z.object({
  /** 群聊的唯一标志 */
  chatid: z.string().optional(),
});
export type CreateGroupChatResponse = z.infer<typeof CreateGroupChatResponseSchema>;

/**
 * 获取群聊会话
 * @see https://developer.work.weixin.qq.com/document/path/98914
 */
export const GetAppChatRequestSchema = z.object({
  /** 群聊id */
  chatid: z.string(),
});
export type GetAppChatRequest = z.infer<typeof GetAppChatRequestSchema>;
export const GetAppChatResponseSchema = z.object({
  /** 群聊信息 */
  chat_info: z.object({ chatid: z.string(), name: z.string(), owner: z.string(), userlist: z.array(z.string()), chat_type: z.number() }).optional(),
});
export type GetAppChatResponse = z.infer<typeof GetAppChatResponseSchema>;

/**
 * 应用推送消息
 * @see https://developer.work.weixin.qq.com/document/path/90071
 */
export const SendAppChatMessageRequestSchema = z.object({
  /** 群聊id */
  chatid: z.string().min(1),
  /** 消息类型，支持text, image, voice, video, file, textcard, news, mpnews, markdown (text-文本消息, image-图片消息, voice-语音消息, video-视频消息, */
  msgtype: z.string(),
  /** 文本消息内容（仅当msgtype为text时） */
  text: z.object({ content: z.string().min(1).max(2048), mentioned_list: z.array(z.string()) }).optional(),
  /** 图片消息内容（仅当msgtype为image时） */
  image: z.object({ media_id: z.string().min(1) }).optional(),
  /** 语音消息内容（仅当msgtype为voice时） */
  voice: z.object({ media_id: z.string().min(1) }).optional(),
  /** 视频消息内容（仅当msgtype为video时） */
  video: z.object({ media_id: z.string().min(1), title: z.string().min(0).max(128), description: z.string().min(0).max(512) }).optional(),
  /** 文件消息内容（仅当msgtype为file时） */
  file: z.object({ media_id: z.string().min(1) }).optional(),
  /** 文本卡片消息内容（仅当msgtype为textcard时） */
  textcard: z.object({ title: z.string().min(1).max(128), description: z.string().min(1).max(512), url: z.string().min(1), btntxt: z.string().min(0).max(4).default('详情') }).optional(),
  /** 图文消息内容（仅当msgtype为news时） */
  news: z.object({ articles: z.array(z.object({ title: z.string().min(1).max(128), description: z.string().min(0).max(512), url: z.string().min(1), picurl: z.string().min(0) })) }).optional(),
  /** 图文消息（mpnews）内容（仅当msgtype为mpnews时） */
  mpnews: z.object({ articles: z.array(z.object({ title: z.string().min(1).max(128), thumb_media_id: z.string().min(1), author: z.string().min(0).max(64), content_source_url: z.string().min(0), content: z.string().min(1).max(683072), digest: z.string().min(0).max(512) })) }).optional(),
  /** Markdown消息内容（仅当msgtype为markdown时） */
  markdown: z.object({ content: z.string().min(1).max(2048) }).optional(),
  /** 表示是否是保密消息，0表示否，1表示是，默认0 (0-非保密, 1-保密) */
  safe: z.number().optional(),
});
export type SendAppChatMessageRequest = z.infer<typeof SendAppChatMessageRequestSchema>;

/**
 * 修改群聊会话
 * @see https://developer.work.weixin.qq.com/document/path/98913
 */
export const UpdateAppChatRequestSchema = z.object({
  /** 群聊id */
  chatid: z.string(),
  /** 新的群聊名。若不需更新，请忽略此参数。最多50个utf8字符，超过将截断 */
  name: z.string().max(50).optional(),
  /** 新群主的id。若不需更新，请忽略此参数。课程群聊群主必须拥有课程群创建权限，del_user_list包含群主时本字段必填 */
  owner: z.string().max(64).optional(),
  /** 添加成员的id列表 */
  add_user_list: z.array(z.string()).optional(),
  /** 踢出成员的id列表 */
  del_user_list: z.array(z.string()).optional(),
});
export type UpdateAppChatRequest = z.infer<typeof UpdateAppChatRequestSchema>;

/**
 * 发送「学校通知」
 * @see https://developer.work.weixin.qq.com/document/path/91609
 */
export const SendExternalContactMessageRequestSchema = z.object({
  /** 指定发送对象，0表示发送给家长，1表示发送给学生，2表示发送给家长和学生，默认为0 (0-发送给家长, 1-发送给学生, 2-发送给家长和学生) */
  recv_scope: z.number().optional(),
  /** 家校通讯录家长列表，recv_scope为0或2表示发送给对应的家长，recv_scope为1忽略（最多支持1000个） */
  to_parent_userid: z.array(z.string()).optional(),
  /** 家校通讯录学生列表，recv_scope为0表示发送给学生的所有家长，recv_scope为1表示发送给学生，recv_scope为2表示发送给学生和学生的所有 */
  to_student_userid: z.array(z.string()).optional(),
  /** 家校通讯录部门列表，recv_scope为0表示发送给班级的所有家长，recv_scope为1表示发送给班级的所有学生，recv_scope为2表示发送给班级的 */
  to_party: z.array(z.string()).optional(),
  /** 1表示字段生效，0表示字段无效。recv_scope为0表示发送给学校的所有家长，recv_scope为1表示发送给学校的所有学生，recv_scope为2表示 (0-无效, 1-生效) */
  toall: z.number().optional(),
  /** 消息类型，支持text、image、voice、video、file、news、mpnews、miniprogram等 (text-文本, image-图片, voice-语音, video-视频, file-文件, news-图文, .. */
  msgtype: z.string(),
  /** 企业应用的id，整型。可在应用的设置页面查看 */
  agentid: z.number().min(1),
  /** 文本消息内容对象（仅msgtype为text时有效） */
  text: z.object({ content: z.string().min(1).max(2048) }).optional(),
  /** 图片消息内容对象（仅msgtype为image时有效） */
  image: z.object({ media_id: z.string().min(1) }).optional(),
  /** 语音消息内容对象（仅msgtype为voice时有效） */
  voice: z.object({ media_id: z.string().min(1) }).optional(),
  /** 视频消息内容对象（仅msgtype为video时有效） */
  video: z.object({ media_id: z.string().min(1), title: z.string().min(1).max(128), description: z.string().min(1).max(512) }).optional(),
  /** 文件消息内容对象（仅msgtype为file时有效） */
  file: z.object({ media_id: z.string().min(1) }).optional(),
  /** 图文消息内容对象（仅msgtype为news时有效） */
  news: z.object({ articles: z.array(z.object({ title: z.string().min(1).max(128), description: z.string().min(1).max(512), url: z.string().min(1), picurl: z.string().min(1) })) }).optional(),
  /** 图文消息（mpnews）内容对象（仅msgtype为mpnews时有效） */
  mpnews: z.object({ articles: z.array(z.object({ title: z.string().min(1).max(128), thumb_media_id: z.string().min(1), author: z.string().min(1).max(64), content_source_url: z.string().min(1), content: z.string().min(1).max(683072), digest: z.string().min(1).max(512) })) }).optional(),
  /** 小程序消息内容对象（仅msgtype为miniprogram时有效） */
  miniprogram: z.object({ appid: z.string().min(1), title: z.string().min(1), page: z.string().min(1) }).optional(),
  /** 表示是否开启id转译，0表示否，1表示是，默认0 (0-否, 1-是) */
  enable_id_trans: z.number().optional(),
  /** 表示是否开启重复消息检查，0表示否，1表示是，默认0 (0-否, 1-是) */
  enable_duplicate_check: z.number().optional(),
  /** 表示重复消息检查的时间间隔，默认1800s，最大不超过4小时（14400s） */
  duplicate_check_interval: z.number().min(1800).max(14400).default(1800).optional(),
});
export type SendExternalContactMessageRequest = z.infer<typeof SendExternalContactMessageRequestSchema>;
export const SendExternalContactMessageResponseSchema = z.object({
  /** 无效的家长userid列表 */
  invalid_parent_userid: z.array(z.string()).optional(),
  /** 无效的学生userid列表 */
  invalid_student_userid: z.array(z.string()).optional(),
  /** 无效的部门userid列表 */
  invalid_party: z.array(z.string()).optional(),
});
export type SendExternalContactMessageResponse = z.infer<typeof SendExternalContactMessageResponseSchema>;

/**
 * 撤回应用消息
 * @see https://developer.work.weixin.qq.com/document/path/94867
 */
export const RecallAppMessageRequestSchema = z.object({
  /** 消息ID。从应用发送消息接口处获得 */
  msgid: z.string(),
});
export type RecallAppMessageRequest = z.infer<typeof RecallAppMessageRequestSchema>;

/**
 * 发送应用消息
 * @see https://developer.work.weixin.qq.com/document/path/90060
 */
export const SendMessageRequestSchema = z.object({
  /** 指定接收消息的成员，成员ID列表（多个接收者用'|'分隔，最多支持1000个）。特殊情况：指定为"@all"，则向该企业应用的全部成员发送 */
  touser: z.string().max(64000).optional(),
  /** 指定接收消息的部门，部门ID列表，多个接收者用'|'分隔，最多支持100个。当touser为"@all"时忽略本参数 */
  toparty: z.string().max(6400).optional(),
  /** 指定接收消息的标签，标签ID列表，多个接收者用'|'分隔，最多支持100个。当touser为"@all"时忽略本参数 */
  totag: z.string().max(6400).optional(),
  /** 消息类型，可选：text, image, voice, video, file, textcard, news, mpnews等 (text-文本消息, image-图片消息, voice-语音消息, video-视频消息, file-文件 */
  msgtype: z.string(),
  /** 企业应用的id，整型 */
  agentid: z.number().min(1).max(2147483647),
  /** 文本消息对象（仅当msgtype为text时有效） */
  text: z.object({ content: z.string().min(1).max(2048) }).optional(),
  /** 图片消息对象（仅当msgtype为image时有效） */
  image: z.object({ media_id: z.string().min(1).max(64) }).optional(),
  /** 语音消息对象（仅当msgtype为voice时有效） */
  voice: z.object({ media_id: z.string().min(1).max(64) }).optional(),
  /** 视频消息对象（仅当msgtype为video时有效） */
  video: z.object({ media_id: z.string().min(1).max(64), title: z.string().min(1).max(128), description: z.string().min(1).max(512) }).optional(),
  /** 文件消息对象（仅当msgtype为file时有效） */
  file: z.object({ media_id: z.string().min(1).max(64) }).optional(),
  /** 文本卡片消息对象（仅当msgtype为textcard时有效） */
  textcard: z.object({ title: z.string().min(1).max(128), description: z.string().min(1).max(512), url: z.string().min(1).max(2048), btntxt: z.string().min(1).max(4).default('详情') }).optional(),
  /** 图文消息对象（仅当msgtype为news时有效） */
  news: z.object({ articles: z.array(z.object({ title: z.string().min(1).max(128), description: z.string().min(1).max(512), url: z.string().min(1).max(2048), picurl: z.string().min(1).max(2048), appid: z.string().min(1).max(64), pagepath: z.string().min(1).max(128) })) }).optional(),
  /** 图文消息（mpnews）对象（仅当msgtype为mpnews时有效） */
  mpnews: z.object({ articles: z.array(z.object({ title: z.string().min(1).max(128), thumb_media_id: z.string().min(1).max(64), author: z.string().min(1).max(128), content_source_url: z.string().min(1).max(2048), content: z.string().min(1).max(2048), digest: z.string().min(1).max(512) })) }).optional(),
  /** 表示是否是保密消息，0表示可对外分享，1表示不能分享且内容显示水印，默认为0 (0-可对外分享, 1-保密消息（水印）) */
  safe: z.number().optional(),
  /** 表示是否开启id转译，0表示否，1表示是，默认0 (0-关闭, 1-开启) */
  enable_id_trans: z.number().optional(),
  /** 表示是否开启重复消息检查，0表示否，1表示是，默认0 (0-关闭, 1-开启) */
  enable_duplicate_check: z.number().optional(),
  /** 表示重复消息检查的时间间隔，默认1800s，最大不超过4小时（14400s） */
  duplicate_check_interval: z.number().min(60).max(14400).default(1800).optional(),
});
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
export const SendMessageResponseSchema = z.object({
  /** 不合法的userid，不区分大小写，统一转为小写 */
  invaliduser: z.string().optional(),
  /** 不合法的partyid */
  invalidparty: z.string().optional(),
  /** 不合法的标签id */
  invalidtag: z.string().optional(),
  /** 没有基础接口许可的userid */
  unlicenseduser: z.string().optional(),
  /** 消息id，用于撤回应用消息 */
  msgid: z.string().optional(),
  /** 仅特定消息类型返回，用于更新模版卡片消息 */
  response_code: z.string().optional(),
});
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;

/**
 * 更新模版卡片消息
 * @see https://developer.work.weixin.qq.com/document/path/94963
 */
export const UpdateTemplateCardRequestSchema = z.object({
  /** 企业的成员ID列表（最多支持1000个） */
  userids: z.array(z.string()).optional(),
  /** 企业的部门ID列表（最多支持100个） */
  partyids: z.array(z.number()).optional(),
  /** 企业的标签ID列表（最多支持100个） */
  tagids: z.array(z.number()).optional(),
  /** 更新整个任务接收人员 (0-否, 1-是) */
  atall: z.number().optional(),
  /** 应用的agentid */
  agentid: z.number(),
  /** 更新卡片所需要消费的code，可通过发消息接口和回调接口返回值获取，一个code只能调用一次该接口，且只能在72小时内调用 */
  response_code: z.string(),
  /** 表示是否开启id转译，0表示否，1表示是，默认0 (0-否, 1-是) */
  enable_id_trans: z.number().optional(),
  /** 按钮更新信息（仅原卡片为按钮交互型、投票选择型、多项选择型的卡片可以调用） */
  button: z.object({ replace_name: z.string() }).optional(),
  /** 模板卡片信息（可更新成任何一种模板卡片） */
  template_card: z.object({ card_type: z.string(), source: z.object({ icon_url: z.string(), desc: z.string().max(20), desc_color: z.number() }), action_menu: z.object({ desc: z.string(), action_list: z.array(z.object({ text: z.string(), key: z.string().min(1).max(1024) })) }), main_title: z.object({ title: z.string().max(36), desc: z.string().max(44) }), quote_area: z.object({ type: z.number(), url: z.string(), appid: z.string(), pagepath: z.string(), title: z.string(), quote_text: z.string() }), emphasis_content: z.object({ title: z.string().max(14), desc: z.string().max(22) }), sub_title_text: z.string().max(160), horizontal_content_list: z.array(z.object({ type: z.number(), keyname: z.string().max(5), value: z.string().max(30), url: z.string(), media_id: z.string(), userid: z.string() })), jump_list: z.array(z.object({ type: z.number(), title: z.string().max(18), url: z.string(), appid: z.string(), pagepath: z.string() })), card_action: z.object({ type: z.number(), url: z.string(), appid: z.string(), pagepath: z.string() }) }).optional(),
});
export type UpdateTemplateCardRequest = z.infer<typeof UpdateTemplateCardRequestSchema>;

/**
 * 修改群聊会话
 * @see https://developer.work.weixin.qq.com/document/path/101044
 */
export const UpdateGroupChatRequestSchema = z.object({
  /** 智能表格ID。需为当前应用创建的智能表格 */
  docid: z.string(),
  /** 群聊ID，需为对应智能表自动规则创建群聊的ID */
  chat_id: z.string(),
  /** 新群主的id。若不需更新，请忽略此参数。del_user_list包含群主时本字段必填 */
  owner: z.string().optional(),
  /** 添加成员的id列表，一次最多传入500人 */
  add_user_list: z.array(z.string()).optional(),
  /** 踢出成员的id列表，一次最多传入500人 */
  del_user_list: z.array(z.string()).optional(),
});
export type UpdateGroupChatRequest = z.infer<typeof UpdateGroupChatRequestSchema>;

