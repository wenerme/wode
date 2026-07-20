// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 禁用/启用邮箱账号
 * @see https://developer.work.weixin.qq.com/document/path/97683
 */
export const ActEmailAccountRequestSchema = z.object({
  /** 成员UserID，与publicemail_id至少传一项，同时传则只操作userid。不可禁用超管与企业创建人 */
  userid: z.string().min(1).max(64),
  /** 业务邮箱ID，与userid至少传一项，同时传则只操作userid */
  publicemail_id: z.number().min(1),
  /** 1启用，2禁用 (1-启用, 2-禁用) */
  type: z.number(),
});
export type ActEmailAccountRequest = z.infer<typeof ActEmailAccountRequestSchema>;

/**
 * 发送普通邮件
 * @see https://developer.work.weixin.qq.com/document/path/97445
 */
export const SendExmailRequestSchema = z.object({
  /** 收件人，to.emails 和 to.userids 至少传一个 */
  to: z.object({ emails: z.array(z.string()), userids: z.array(z.string()) }),
  /** 抄送 */
  cc: z.object({ emails: z.array(z.string()), userids: z.array(z.string()) }).optional(),
  /** 密送 */
  bcc: z.object({ emails: z.array(z.string()), userids: z.array(z.string()) }).optional(),
  /** 标题 */
  subject: z.string(),
  /** 内容 */
  content: z.string(),
  /** 附件相关，所有附件加正文的大小不允许超过50M，且附件个数不能超过200个 */
  attachment_list: z.array(z.object({ file_name: z.string(), content: z.string() })).optional(),
  /** 内容类型 html，text（默认是html） (html-HTML, text-纯文本) */
  content_type: z.string().optional(),
  /** 表示是否开启id转译，0表示否，1表示是，默认0。仅第三方应用需要用到，企业自建应用可以忽略。目前仅subject、content、attachment_lis (0-否, 1-是) */
  enable_id_trans: z.number().optional(),
});
export type SendExmailRequest = z.infer<typeof SendExmailRequestSchema>;

export const GetEmailAliasResponseSchema = z.object({
  /** 当前发信账号的主邮箱地址，发邮件将会以此邮箱地址为发件人 */
  email: z.string().optional(),
  /** 别名邮箱地址列表，能作为收件人收邮件 */
  alias_list: z.array(z.string()).optional(),
});
export type GetEmailAliasResponse = z.infer<typeof GetEmailAliasResponseSchema>;

/**
 * 获取收件箱邮件列表
 * @see https://developer.work.weixin.qq.com/document/path/97681
 */
export const ListMailRequestSchema = z.object({
  /** 开始时间，unix时间戳 [timestamp] */
  begin_time: z.number(),
  /** 结束时间，unix时间戳 [timestamp] */
  end_time: z.number(),
  /** 上一次调用时返回的next_cursor，第一次拉取可以不填 */
  cursor: z.string().optional(),
  /** 期望请求的数据量 */
  limit: z.number().max(1000).default(100).optional(),
});
export type ListMailRequest = z.infer<typeof ListMailRequestSchema>;
export const ListMailResponseSchema = z.object({
  /** 应用邮箱账号中邮件未读数 */
  next_cursor: z.string().optional(),
  /** 是否还有更多数据。0-没有 1-有 (0-没有, 1-有) */
  has_more: z.number().optional(),
  /** 邮件列表 */
  mail_list: z.array(z.object({ mail_id: z.string() })).optional(),
});
export type ListMailResponse = z.infer<typeof ListMailResponseSchema>;

/**
 * 获取邮件内容
 * @see https://developer.work.weixin.qq.com/document/path/97979
 */
export const ReadMailRequestSchema = z.object({
  /** 邮件id */
  mail_id: z.string(),
});
export type ReadMailRequest = z.infer<typeof ReadMailRequestSchema>;
export const ReadMailResponseSchema = z.object({
  /** 邮件eml内容 */
  mail_data: z.string().optional(),
});
export type ReadMailResponse = z.infer<typeof ReadMailResponseSchema>;

/**
 * 更新应用邮箱账号
 * @see https://developer.work.weixin.qq.com/document/path/97682
 */
export const UpdateAppEmailAliasRequestSchema = z.object({
  /** 修改后的应用邮箱账号 */
  new_email: z.string(),
});
export type UpdateAppEmailAliasRequest = z.infer<typeof UpdateAppEmailAliasRequestSchema>;

/**
 * 创建邮件群组
 * @see https://developer.work.weixin.qq.com/document/path/95510
 */
export const CreateMailGroupRequestSchema = z.object({
  /** 邮件群组ID，邮箱格式 */
  groupid: z.string(),
  /** 邮件群组名称，不能与其他群组重名 */
  groupname: z.string().max(200),
  /** 群组内成员邮箱地址，读取成员的biz_mail字段，email_list，group_list，department_list，tag_list至少填写一个，不 */
  email_list: z.object({ list: z.array(z.string()) }).optional(),
  /** 群组内包含的标签ID列表 */
  tag_list: z.object({ list: z.array(z.number()) }).optional(),
  /** 群组内包含的部门ID列表 */
  department_list: z.object({ list: z.array(z.number()) }).optional(),
  /** 群组内包含的群组邮箱列表 */
  group_list: z.object({ list: z.array(z.string()) }).optional(),
  /** 群组使用权限。0: 企业成员, 1任何人，2:组内成员，3:自定义成员。当值为0、1、2时，不得传入allow_emaillist，allow_departme (0-企业成员, 1-任何人, 2-组内成员, 3-自定义成员) */
  allow_type: z.number().optional(),
  /** 允许使用群组群发的成员邮箱地址列表 */
  allow_emaillist: z.object({ list: z.array(z.string()) }).optional(),
  /** 允许使用群组群发的部门ID列表 */
  allow_departmentlist: z.object({ list: z.array(z.number()) }).optional(),
  /** 允许使用群组群发的标签ID列表 */
  allow_taglist: z.object({ list: z.array(z.number()) }).optional(),
});
export type CreateMailGroupRequest = z.infer<typeof CreateMailGroupRequestSchema>;

/**
 * 删除邮件群组
 * @see https://developer.work.weixin.qq.com/document/path/97996
 */
export const DeleteMailGroupRequestSchema = z.object({
  /** 邮件群组ID，邮箱格式 */
  groupid: z.string(),
});
export type DeleteMailGroupRequest = z.infer<typeof DeleteMailGroupRequestSchema>;

/**
 * 获取邮件群组详情
 * @see https://developer.work.weixin.qq.com/document/path/97997
 */
export const GetMailGroupRequestSchema = z.object({
  /** 邮件群组ID，邮箱格式 */
  groupid: z.string(),
});
export type GetMailGroupRequest = z.infer<typeof GetMailGroupRequestSchema>;
export const GetMailGroupResponseSchema = z.object({
  /** 邮件群组ID，邮箱格式 */
  groupid: z.string().optional(),
  /** 邮件群组名称 */
  groupname: z.string().optional(),
  /** 群组内成员邮箱地址 */
  email_list: z.object({ list: z.array(z.string()) }).optional(),
  /** 群组内包含的标签ID */
  tag_list: z.object({ list: z.array(z.number()) }).optional(),
  /** 群组内包含的部门ID */
  department_list: z.object({ list: z.array(z.number()) }).optional(),
  /** 群组内包含的群组邮箱ID */
  group_list: z.object({ list: z.array(z.string()) }).optional(),
  /** 群组使用权限。0: 企业成员, 1任何人，2:组内成员，3:自定义成员。 (0-企业成员, 1-任何人, 2-组内成员, 3-自定义成员) */
  allow_type: z.number().optional(),
  /** 允许使用群组群发的成员邮箱地址 */
  allow_emaillist: z.object({ list: z.array(z.string()) }).optional(),
  /** 允许使用群组群发的部门ID */
  allow_departmentlist: z.object({ list: z.array(z.number()) }).optional(),
  /** 允许使用群组群发的标签ID */
  allow_taglist: z.object({ list: z.array(z.number()) }).optional(),
});
export type GetMailGroupResponse = z.infer<typeof GetMailGroupResponseSchema>;

/**
 * 模糊搜索邮件群组
 * @see https://developer.work.weixin.qq.com/document/path/97998
 */
export const SearchMailGroupRequestSchema = z.object({
  /** 1开启模糊搜索，0获取全部邮件群组 (1-开启模糊搜索, 0-获取全部邮件群组) */
  fuzzy: z.number(),
  /** 邮件群组ID，邮箱格式 */
  groupid: z.string().optional(),
});
export type SearchMailGroupRequest = z.infer<typeof SearchMailGroupRequestSchema>;
export const SearchMailGroupResponseSchema = z.object({
  /** 返回条数 */
  count: z.number().optional(),
  /** 邮件群组列表 */
  groups: z.array(z.object({ groupid: z.string(), groupname: z.string() })).optional(),
});
export type SearchMailGroupResponse = z.infer<typeof SearchMailGroupResponseSchema>;

/**
 * 更新邮件群组
 * @see https://developer.work.weixin.qq.com/document/path/97995
 */
export const UpdateMailGroupRequestSchema = z.object({
  /** 邮件群组ID，邮箱格式 */
  groupid: z.string(),
  /** 邮件群组名称，不能与其他群组重名，长度限定200字节 */
  groupname: z.string().min(1).max(200).optional(),
  /** 群组内成员邮箱地址，读取成员的biz_mail字段，不传则不变，传空则清空。成员由email_list，group_list，department_list，t */
  email_list: z.object({ list: z.array(z.string()) }).optional(),
  /** 群组内包含的标签ID，不传则不变，传空为清空 */
  tag_list: z.object({ list: z.array(z.number()) }).optional(),
  /** 群组内包含的部门ID，不传则不变，传空为清空 */
  department_list: z.object({ list: z.array(z.number()) }).optional(),
  /** 群组内包含的群组邮箱ID，不传则不变，传空为清空 */
  group_list: z.object({ list: z.array(z.string()) }).optional(),
  /** 群组使用权限。0: 企业成员, 1任何人，2:组内成员，3:自定义成员 (0-企业成员, 1-任何人, 2-组内成员, 3-自定义成员) */
  allow_type: z.number().optional(),
  /** 允许使用群组群发的成员邮箱地址，不传则不变，传空为清空 */
  allow_emaillist: z.object({ list: z.array(z.string()) }).optional(),
  /** 允许使用群组群发的部门ID，不传则不变，传空为清空 */
  allow_departmentlist: z.object({ list: z.array(z.number()) }).optional(),
  /** 允许使用群组群发的标签ID，不传则不变，传空为清空 */
  allow_taglist: z.object({ list: z.array(z.number()) }).optional(),
});
export type UpdateMailGroupRequest = z.infer<typeof UpdateMailGroupRequestSchema>;

/**
 * 获取邮件未读数
 * @see https://developer.work.weixin.qq.com/document/path/97685
 */
export const GetMailUnreadCountRequestSchema = z.object({
  /** 成员UserID */
  userid: z.string().min(1).max(64),
});
export type GetMailUnreadCountRequest = z.infer<typeof GetMailUnreadCountRequestSchema>;
export const GetMailUnreadCountResponseSchema = z.object({
  /** 成员邮箱中邮件未读数 */
  count: z.number().optional(),
});
export type GetMailUnreadCountResponse = z.infer<typeof GetMailUnreadCountResponseSchema>;

/**
 * 创建公共邮箱
 * @see https://developer.work.weixin.qq.com/document/path/100185
 */
export const CreatePublicMailRequestSchema = z.object({
  /** 公共邮箱地址 */
  email: z.string(),
  /** 公共邮箱名称，不多于64个字符或32个汉字，不得与其他公共邮箱重名 */
  name: z.string().max(64),
  /** 有权限使用公共邮箱的成员UserID列表。userid_list、department_list、taglist不能同时为空 */
  userid_list: z.object({ list: z.array(z.string()) }).optional(),
  /** 有权限使用公共邮箱的部门ID列表 */
  department_list: z.object({ list: z.array(z.number()) }).optional(),
  /** 有权限使用公共邮箱的标签ID列表 */
  tag_list: z.object({ list: z.array(z.number()) }).optional(),
  /** 是否创建客户端专用密码，0表示否，1表示是，默认0。客户端专用密码只会显示一次，请在客户端中输入该密码进行验证，每次生成的密码皆可使用，请勿告诉他人 (0-否, 1-是) */
  create_auth_code: z.number().optional(),
  /** 创建客户端专用密码的备注，仅当设置create_auth_code=1时有效。创建客户端专用密码时未设置备注则默认为"办公PC", 最长不超过128个字节，必须 */
  auth_code_info: z.object({ remark: z.string().max(128).default('办公PC') }).optional(),
});
export type CreatePublicMailRequest = z.infer<typeof CreatePublicMailRequestSchema>;
export const CreatePublicMailResponseSchema = z.object({
  /** 公共邮箱ID */
  id: z.number().optional(),
  /** 客户端专用密码ID，仅当设置创建客户端专用密码的时候返回，后续可通过接口删除客户端专用密码 */
  auth_code_id: z.number().optional(),
  /** 客户端专用密码, 仅当设置创建客户端专用密码的时候返回，该客户端专用密码仅会返回一次，请妥善存储 */
  auth_code: z.string().optional(),
});
export type CreatePublicMailResponse = z.infer<typeof CreatePublicMailResponseSchema>;

/**
 * 删除公共邮箱
 * @see https://developer.work.weixin.qq.com/document/path/100187
 */
export const DeletePublicMailRequestSchema = z.object({
  /** 公共邮箱ID */
  id: z.number(),
});
export type DeletePublicMailRequest = z.infer<typeof DeletePublicMailRequestSchema>;

/**
 * 删除客户端专用密码
 * @see https://developer.work.weixin.qq.com/document/path/100242
 */
export const DeletePublicMailAuthCodeRequestSchema = z.object({
  /** 公共邮箱ID */
  id: z.number(),
  /** 客户端专用密码ID */
  auth_code_id: z.number(),
});
export type DeletePublicMailAuthCodeRequest = z.infer<typeof DeletePublicMailAuthCodeRequestSchema>;

/**
 * 获取公共邮箱详情
 * @see https://developer.work.weixin.qq.com/document/path/100188
 */
export const GetPublicMailDetailRequestSchema = z.object({
  /** 公共邮箱ID列表 */
  id_list: z.array(z.number()),
});
export type GetPublicMailDetailRequest = z.infer<typeof GetPublicMailDetailRequestSchema>;
export const GetPublicMailDetailResponseSchema = z.object({
  /** 公共邮箱列表 */
  list: z.array(z.object({ id: z.number(), email: z.string(), name: z.string(), userid_list: z.object({ list: z.array(z.string()) }), department_list: z.object({ list: z.array(z.number()) }), tag_list: z.object({ list: z.array(z.number()) }), alias_list: z.object({ list: z.array(z.string()) }) })).optional(),
});
export type GetPublicMailDetailResponse = z.infer<typeof GetPublicMailDetailResponseSchema>;

/**
 * 获取客户端专用密码列表
 * @see https://developer.work.weixin.qq.com/document/path/100241
 */
export const ListPublicMailAuthCodeRequestSchema = z.object({
  /** 公共邮箱ID */
  id: z.number(),
});
export type ListPublicMailAuthCodeRequest = z.infer<typeof ListPublicMailAuthCodeRequestSchema>;
export const ListPublicMailAuthCodeResponseSchema = z.object({
  /** 客户端专用密码列表 */
  auth_code_list: z.array(z.object({ auth_code_id: z.string(), create_time: z.string(), last_use_time: z.string(), remark: z.string() })).optional(),
});
export type ListPublicMailAuthCodeResponse = z.infer<typeof ListPublicMailAuthCodeResponseSchema>;

/**
 * 模糊搜索公共邮箱
 * @see https://developer.work.weixin.qq.com/document/path/100189
 */
export const SearchPublicMailRequestSchema = z.object({
  /** 1开启模糊搜索，0获取全部公共邮箱 (1-开启模糊搜索, 0-获取全部公共邮箱) */
  fuzzy: z.number(),
  /** 公共邮箱名称或邮箱地址 */
  email: z.string().optional(),
});
export type SearchPublicMailRequest = z.infer<typeof SearchPublicMailRequestSchema>;
export const SearchPublicMailResponseSchema = z.object({
  /** 公共邮箱列表 */
  list: z.array(z.object({ id: z.number(), email: z.string(), name: z.string() })).optional(),
});
export type SearchPublicMailResponse = z.infer<typeof SearchPublicMailResponseSchema>;

/**
 * 更新公共邮箱
 * @see https://developer.work.weixin.qq.com/document/path/100186
 */
export const UpdatePublicMailRequestSchema = z.object({
  /** 公共邮箱ID */
  id: z.number(),
  /** 公共邮箱名称，不多于64个字符或32个汉字，不得与其他公共邮箱重名 */
  name: z.string().max(64).optional(),
  /** 有权限使用公共邮箱的成员UserID列表，不传则不变，传空为清空。不能与其他列表同时为空 */
  userid_list: z.object({ list: z.array(z.string()) }).optional(),
  /** 有权限使用公共邮箱的部门列表，不传则不变，传空为清空 */
  department_list: z.object({ list: z.string() }).optional(),
  /** 有权限使用公共邮箱的标签列表，不传则不变，传空为清空 */
  tag_list: z.object({ list: z.string() }).optional(),
  /** 邮箱别名。长度6~64个字节，且为有效的企业邮箱格式。企业内必须唯一，最多可设置5个别名。传空结构或传空数组会清空当前邮箱别名 */
  alias_list: z.object({ list: z.array(z.string()) }).optional(),
  /** 是否创建客户端专用密码，0表示否，1表示是，默认0。一个公共邮箱通过API接口创建的客户端专用密码不能超过10个 (0-否, 1-是) */
  create_auth_code: z.number().optional(),
  /** 创建客户端专用密码的备注，仅当设置create_auth_code=1时有效。未设置备注则默认为"办公PC" */
  auth_code_info: z.object({ remark: z.string().max(128).default('办公PC') }).optional(),
});
export type UpdatePublicMailRequest = z.infer<typeof UpdatePublicMailRequestSchema>;
export const UpdatePublicMailResponseSchema = z.object({
  /** 客户端专用密码ID，仅当设置创建客户端专用密码的时候返回 */
  auth_code_id: z.number().optional(),
  /** 客户端专用密码，仅当设置创建客户端专用密码的时候返回，该客户端专用密码仅会返回一次 */
  auth_code: z.string().optional(),
});
export type UpdatePublicMailResponse = z.infer<typeof UpdatePublicMailResponseSchema>;

/**
 * 获取用户功能属性
 * @see https://developer.work.weixin.qq.com/document/path/97684
 */
export const GetUserOptionRequestSchema = z.object({
  /** 用户UserID */
  userid: z.string(),
  /** 功能设置属性类型列表：1-强制启用安全登录，2-IMAP/SMTP服务，3-POP/SMTP服务，4-是否启用安全登录 (1-强制启用安全登录, 2-IMAP/SMTP服务, 3-POP/SMTP服务, 4-是否启用安全登录) */
  type: z.number(),
});
export type GetUserOptionRequest = z.infer<typeof GetUserOptionRequestSchema>;
export const GetUserOptionResponseSchema = z.object({
  /** 功能属性对象 */
  option: z.object({ list: z.array(z.object({ type: z.number(), value: z.string() })) }).optional(),
});
export type GetUserOptionResponse = z.infer<typeof GetUserOptionResponseSchema>;

/**
 * 更改用户功能属性
 * @see https://developer.work.weixin.qq.com/document/path/98008
 */
export const UpdateUserOptionRequestSchema = z.object({
  /** 用户UserID */
  userid: z.string().min(1),
  /** 功能设置对象 */
  option: z.object({ list: z.array(z.object({ type: z.number(), value: z.string() })) }),
});
export type UpdateUserOptionRequest = z.infer<typeof UpdateUserOptionRequestSchema>;

/**
 * 分配高级功能账号
 * @see https://developer.work.weixin.qq.com/document/path/99320
 */
export const BatchAddVipRequestSchema = z.object({
  /** 要分配高级功能的企业成员userid列表，单次操作最大限制100个 */
  userid_list: z.array(z.string()),
});
export type BatchAddVipRequest = z.infer<typeof BatchAddVipRequestSchema>;
export const BatchAddVipResponseSchema = z.object({
  /** 分配成功的用户列表，包括之前已经分配过的用户 */
  succ_userid_list: z.array(z.string()).optional(),
  /** 分配失败的用户列表 */
  fail_userid_list: z.array(z.string()).optional(),
});
export type BatchAddVipResponse = z.infer<typeof BatchAddVipResponseSchema>;

/**
 * 取消高级功能账号
 * @see https://developer.work.weixin.qq.com/document/path/99321
 */
export const BatchDelVipRequestSchema = z.object({
  /** 要撤销分配高级功能的企业成员userid列表，单次操作最多限制100个 */
  userid_list: z.array(z.string()),
});
export type BatchDelVipRequest = z.infer<typeof BatchDelVipRequestSchema>;
export const BatchDelVipResponseSchema = z.object({
  /** 撤销分配成功的用户列表 */
  succ_userid_list: z.array(z.string()).optional(),
  /** 撤销分配失败的用户列表 */
  fail_userid_list: z.array(z.string()).optional(),
});
export type BatchDelVipResponse = z.infer<typeof BatchDelVipResponseSchema>;

/**
 * 获取高级功能账号列表
 * @see https://developer.work.weixin.qq.com/document/path/99322
 */
export const ListExmailVipRequestSchema = z.object({
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().optional(),
  /** 用于分页查询，每次请求返回的数据上限。默认100，最大200 */
  limit: z.number().min(1).max(200).default(100).optional(),
});
export type ListExmailVipRequest = z.infer<typeof ListExmailVipRequestSchema>;
export const ListExmailVipResponseSchema = z.object({
  /** 是否还有更多数据未获取 */
  has_more: z.boolean().optional(),
  /** 下一次请求的cursor值 */
  next_cursor: z.string().optional(),
  /** 符合条件的企业成员userid列表 */
  userid_list: z.array(z.string()).optional(),
});
export type ListExmailVipResponse = z.infer<typeof ListExmailVipResponseSchema>;

