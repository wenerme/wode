// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取异步任务结果
 * @see https://developer.work.weixin.qq.com/document/path/90482
 */
export const BatchGetResultRequestSchema = z.object({
  /** 异步任务id */
  jobid: z.string().max(64),
});
export type BatchGetResultRequest = z.infer<typeof BatchGetResultRequestSchema>;
export const BatchGetResultResponseSchema = z.object({
  /** 任务状态，1表示任务开始，2表示任务进行中，3表示任务已完成 (1-任务开始, 2-任务进行中, 3-任务已完成) */
  status: z.number().optional(),
  /** 操作类型，1. sync_user(增量更新成员) 2. replace_user(全量覆盖成员)3. replace_party(全量覆盖部门) (sync_user-增量更新成员, replace_user-全量覆盖成员, replac */
  type: z.string().optional(),
  /** 任务运行总条数 */
  total: z.number().min(0).optional(),
  /** 目前运行百分比，当任务完成时为100 */
  percentage: z.number().min(0).max(100).optional(),
  /** 详细的处理结果，当任务完成后此字段有效 */
  result: z.array(z.object({ userid: z.string().min(1).max(64), errcode: z.number(), errmsg: z.string().min(1), action: z.number(), partyid: z.number() })).optional(),
});
export type BatchGetResultResponse = z.infer<typeof BatchGetResultResponseSchema>;

/**
 * 邀请成员
 * @see https://developer.work.weixin.qq.com/document/path/90475
 */
export const BatchInviteRequestSchema = z.object({
  /** 成员ID列表，最多支持1000个 */
  user: z.array(z.string()).optional(),
  /** 部门ID列表，最多支持100个 */
  party: z.array(z.number()).optional(),
  /** 标签ID列表，最多支持100个 */
  tag: z.array(z.number()).optional(),
});
export type BatchInviteRequest = z.infer<typeof BatchInviteRequestSchema>;
export const BatchInviteResponseSchema = z.object({
  /** 非法成员列表 */
  invaliduser: z.array(z.string()).optional(),
  /** 非法部门列表 */
  invalidparty: z.array(z.number()).optional(),
  /** 非法标签列表 */
  invalidtag: z.array(z.number()).optional(),
});
export type BatchInviteResponse = z.infer<typeof BatchInviteResponseSchema>;

/**
 * 全量覆盖部门
 * @see https://developer.work.weixin.qq.com/document/path/90481
 */
export const BatchReplacePartyRequestSchema = z.object({
  /** 上传的csv文件的media_id */
  media_id: z.string(),
  /** 回调信息。如填写该项则任务完成后，通过callback推送事件给企业 */
  callback: z.object({ url: z.string(), token: z.string(), encodingaeskey: z.string() }).optional(),
});
export type BatchReplacePartyRequest = z.infer<typeof BatchReplacePartyRequestSchema>;
export const BatchReplacePartyResponseSchema = z.object({
  /** 异步任务id，最大长度为64字节 */
  jobid: z.string().max(64).optional(),
});
export type BatchReplacePartyResponse = z.infer<typeof BatchReplacePartyResponseSchema>;

/**
 * 全量覆盖成员
 * @see https://developer.work.weixin.qq.com/document/path/90480
 */
export const BatchReplaceUserRequestSchema = z.object({
  /** 上传的csv文件的media_id */
  media_id: z.string(),
  /** 是否邀请新建的成员使用企业微信，默认值为true */
  to_invite: z.boolean().default(true).optional(),
  /** 回调信息 */
  callback: z.object({ url: z.string(), token: z.string(), encodingaeskey: z.string() }).optional(),
});
export type BatchReplaceUserRequest = z.infer<typeof BatchReplaceUserRequestSchema>;
export const BatchReplaceUserResponseSchema = z.object({
  /** 异步任务id，最大长度为64字节 */
  jobid: z.string().max(64).optional(),
});
export type BatchReplaceUserResponse = z.infer<typeof BatchReplaceUserResponseSchema>;

/**
 * 增量更新成员
 * @see https://developer.work.weixin.qq.com/document/path/90479
 */
export const BatchSyncUserRequestSchema = z.object({
  /** 上传的csv文件的media_id */
  media_id: z.string(),
  /** 是否邀请新建的成员使用企业微信，默认值为true */
  to_invite: z.boolean().default(true).optional(),
  /** 回调信息。如填写该项则任务完成后，通过callback推送事件给企业 */
  callback: z.object({ url: z.string(), token: z.string(), encodingaeskey: z.string() }).optional(),
});
export type BatchSyncUserRequest = z.infer<typeof BatchSyncUserRequestSchema>;
export const BatchSyncUserResponseSchema = z.object({
  /** 异步任务id，最大长度为64字节 */
  jobid: z.string().max(64).optional(),
});
export type BatchSyncUserResponse = z.infer<typeof BatchSyncUserResponseSchema>;

/**
 * 获取加入企业二维码
 * @see https://developer.work.weixin.qq.com/document/path/91714
 */
export const GetJoinQrcodeRequestSchema = z.object({
  /** qrcode尺寸类型，1: 171 x 171; 2: 399 x 399; 3: 741 x 741; 4: 2052 x 2052 (1-171 x 171, 2-399 x 399, 3-741 x 741, 4-2052 x 205 */
  size_type: z.number().optional(),
});
export type GetJoinQrcodeRequest = z.infer<typeof GetJoinQrcodeRequestSchema>;
export const GetJoinQrcodeResponseSchema = z.object({
  /** 二维码链接，有效期7天 */
  join_qrcode: z.string().optional(),
});
export type GetJoinQrcodeResponse = z.infer<typeof GetJoinQrcodeResponseSchema>;

/**
 * 创建部门
 * @see https://developer.work.weixin.qq.com/document/path/90033
 */
export const CreateDepartmentRequestSchema = z.object({
  /** 部门名称。同一个层级的部门名称不能重复。长度限制为1~64个UTF-8字符，字符不能包括\:*?"<>｜ */
  name: z.string().min(1).max(64),
  /** 英文名称。同一个层级的部门名称不能重复。需要在管理后台开启多语言支持才能生效。长度限制为1~64个字符，字符不能包括\:*?"<>｜ */
  name_en: z.string().min(1).max(64).optional(),
  /** 父部门id，32位整型 */
  parentid: z.number().min(1).max(4294967295),
  /** 在父部门中的次序值。order值大的排序靠前。有效的值范围是[0, 2^32) */
  order: z.number().min(0).max(4294967295).optional(),
  /** 部门id，32位整型，指定时必须大于1。若不填该参数，将自动生成id */
  id: z.number().min(2).max(4294967295).optional(),
});
export type CreateDepartmentRequest = z.infer<typeof CreateDepartmentRequestSchema>;
export const CreateDepartmentResponseSchema = z.object({
  /** 创建的部门id */
  id: z.number().optional(),
});
export type CreateDepartmentResponse = z.infer<typeof CreateDepartmentResponseSchema>;

/**
 * 删除部门
 * @see https://developer.work.weixin.qq.com/document/path/90035
 */
export const DeleteDepartmentRequestSchema = z.object({
  /** 部门id（不能删除根部门；不能删除含有子部门、成员的部门） */
  id: z.number(),
});
export type DeleteDepartmentRequest = z.infer<typeof DeleteDepartmentRequestSchema>;

/**
 * 获取单个部门详情
 * @see https://developer.work.weixin.qq.com/document/path/95352
 */
export const GetDepartmentRequestSchema = z.object({
  /** 部门id。 */
  id: z.number(),
});
export type GetDepartmentRequest = z.infer<typeof GetDepartmentRequestSchema>;
export const GetDepartmentResponseSchema = z.object({
  /** 部门详情 */
  department: z.object({ id: z.number(), name: z.string(), name_en: z.string(), department_leader: z.array(z.string()), parentid: z.number(), order: z.number() }).optional(),
});
export type GetDepartmentResponse = z.infer<typeof GetDepartmentResponseSchema>;

/**
 * 获取部门列表
 * @see https://developer.work.weixin.qq.com/document/path/90036
 */
export const ListDepartmentRequestSchema = z.object({
  /** 部门id。获取指定部门及其下的子部门（递归）。如果不填，默认获取全量组织架构 */
  id: z.number().min(1).optional(),
});
export type ListDepartmentRequest = z.infer<typeof ListDepartmentRequestSchema>;
export const ListDepartmentResponseSchema = z.object({
  /** 部门列表数据 */
  department: z.array(z.object({ id: z.number(), name: z.string(), name_en: z.string(), department_leader: z.array(z.string()), parentid: z.number(), order: z.number() })).optional(),
});
export type ListDepartmentResponse = z.infer<typeof ListDepartmentResponseSchema>;

/**
 * 获取子部门ID列表
 * @see https://developer.work.weixin.qq.com/document/path/95350
 */
export const SimpleListDepartmentRequestSchema = z.object({
  /** 部门id。获取指定部门及其下的子部门（递归）。如果不填，默认获取全量组织架构 */
  id: z.number().optional(),
});
export type SimpleListDepartmentRequest = z.infer<typeof SimpleListDepartmentRequestSchema>;
export const SimpleListDepartmentResponseSchema = z.object({
  /** 部门列表数据 */
  department_id: z.array(z.object({ id: z.number(), parentid: z.number(), order: z.string() })).optional(),
});
export type SimpleListDepartmentResponse = z.infer<typeof SimpleListDepartmentResponseSchema>;

/**
 * 更新部门
 * @see https://developer.work.weixin.qq.com/document/path/90034
 */
export const UpdateDepartmentRequestSchema = z.object({
  /** 部门id */
  id: z.number(),
  /** 部门名称。长度限制为1~64个UTF-8字符，字符不能包括\:*?"<>｜ */
  name: z.string().min(1).max(64).optional(),
  /** 英文名称，需要在管理后台开启多语言支持才能生效。长度限制为1~64个字符，字符不能包括\:*?"<>｜ */
  name_en: z.string().min(1).max(64).optional(),
  /** 父部门id */
  parentid: z.number().optional(),
  /** 在父部门中的次序值。order值大的排序靠前。有效的值范围是[0, 2^32) */
  order: z.number().min(0).max(4294967295).optional(),
});
export type UpdateDepartmentRequest = z.infer<typeof UpdateDepartmentRequestSchema>;

/**
 * 导出部门
 * @see https://developer.work.weixin.qq.com/document/path/94852
 */
export const ExportDepartmentRequestSchema = z.object({
  /** Base64编码后的加密密钥。长度固定为43，从a-z, A-Z, 0-9共62个字符中选取，是AESKey的Base64编码。解码后即为32字节长的AESKe [base64] */
  encoding_aeskey: z.string().min(43).max(43),
  /** 每块数据的部门数，支持范围[10^4^,10^6^]，默认值为10^6^ */
  block_size: z.number().min(10000).max(1000000).default(1000000).optional(),
});
export type ExportDepartmentRequest = z.infer<typeof ExportDepartmentRequestSchema>;
export const ExportDepartmentResponseSchema = z.object({
  /** 任务ID，可通过获取导出结果接口查询任务结果 */
  jobid: z.string().optional(),
});
export type ExportDepartmentResponse = z.infer<typeof ExportDepartmentResponseSchema>;

/**
 * 获取导出结果
 * @see https://developer.work.weixin.qq.com/document/path/94854
 */
export const GetExportResultRequestSchema = z.object({
  /** 导出任务ID，由提交导出任务接口返回 */
  jobid: z.string(),
});
export type GetExportResultRequest = z.infer<typeof GetExportResultRequestSchema>;
export const GetExportResultResponseSchema = z.object({
  /** 任务状态：0-未处理，1-处理中，2-完成，3-异常失败 (0-未处理, 1-处理中, 2-完成, 3-异常失败) */
  status: z.number().optional(),
  /** 数据文件列表 */
  data_list: z.array(z.object({ url: z.string(), size: z.number().min(0), md5: z.string() })).optional(),
});
export type GetExportResultResponse = z.infer<typeof GetExportResultResponseSchema>;

/**
 * 导出成员
 * @see https://developer.work.weixin.qq.com/document/path/94849
 */
export const ExportSimpleUserRequestSchema = z.object({
  /** Base64编码后的加密密钥。长度固定为43，从a-z, A-Z, 0-9共62个字符中选取，是AESKey的Base64编码。解码后即为32字节长的AESKe [base64] */
  encoding_aeskey: z.string().min(43).max(43),
  /** 每块数据的人员数，支持范围[10^4^,10^6^]，默认值为10^6^ */
  block_size: z.number().min(10000).max(1000000).default(1000000).optional(),
});
export type ExportSimpleUserRequest = z.infer<typeof ExportSimpleUserRequestSchema>;
export const ExportSimpleUserResponseSchema = z.object({
  /** 任务ID，可通过获取导出结果接口查询任务结果 */
  jobid: z.string().optional(),
});
export type ExportSimpleUserResponse = z.infer<typeof ExportSimpleUserResponseSchema>;

/**
 * 导出标签成员
 * @see https://developer.work.weixin.qq.com/document/path/94853
 */
export const ExportTagUserRequestSchema = z.object({
  /** 需要导出的标签ID */
  tagid: z.number(),
  /** Base64编码后的加密密钥。长度固定为43，是AESKey的Base64编码。解码后即为32字节长的AESKey。加密方式采用AES-256-CBC方式。 [base64] */
  encoding_aeskey: z.string().min(43).max(43),
  /** 每块数据的人员数和部门数之和 */
  block_size: z.number().min(10000).max(1000000).default(1000000).optional(),
});
export type ExportTagUserRequest = z.infer<typeof ExportTagUserRequestSchema>;
export const ExportTagUserResponseSchema = z.object({
  /** 任务ID，可通过获取导出结果接口查询任务结果 */
  jobid: z.string().optional(),
});
export type ExportTagUserResponse = z.infer<typeof ExportTagUserResponseSchema>;

/**
 * 导出成员详情
 * @see https://developer.work.weixin.qq.com/document/path/94851
 */
export const ExportUserRequestSchema = z.object({
  /** Base64编码后的加密密钥。长度固定为43，是AESKey的Base64编码 [base64] */
  encoding_aeskey: z.string().min(43).max(43),
  /** 每块数据的人员数 */
  block_size: z.number().min(10000).max(1000000).default(1000000).optional(),
});
export type ExportUserRequest = z.infer<typeof ExportUserRequestSchema>;
export const ExportUserResponseSchema = z.object({
  /** 任务ID，可通过获取导出结果接口查询任务结果 */
  jobid: z.string().optional(),
});
export type ExportUserResponse = z.infer<typeof ExportUserResponseSchema>;

/**
 * 增加标签成员
 * @see https://developer.work.weixin.qq.com/document/path/90042
 */
export const AddTagUsersRequestSchema = z.object({
  /** 标签ID */
  tagid: z.number(),
  /** 企业成员ID列表，与partylist不能同时为空，单次请求个数不超过1000 */
  userlist: z.array(z.string()).optional(),
  /** 企业部门ID列表，与userlist不能同时为空，单次请求个数不超过100 */
  partylist: z.array(z.number()).optional(),
});
export type AddTagUsersRequest = z.infer<typeof AddTagUsersRequestSchema>;
export const AddTagUsersResponseSchema = z.object({
  /** 非法的成员账号列表 */
  invalidlist: z.array(z.string()).optional(),
  /** 非法的部门id列表 */
  invalidparty: z.array(z.number()).optional(),
});
export type AddTagUsersResponse = z.infer<typeof AddTagUsersResponseSchema>;

/**
 * 创建标签
 * @see https://developer.work.weixin.qq.com/document/path/90038
 */
export const CreateTagRequestSchema = z.object({
  /** 标签名称，长度限制为32个字以内（汉字或英文字母），标签名不可与其他标签重名 */
  tagname: z.string().min(1).max(32),
  /** 标签id，非负整型，指定此参数时新增的标签会生成对应的标签id，不指定时则以目前最大的id自增 */
  tagid: z.number().min(0).optional(),
});
export type CreateTagRequest = z.infer<typeof CreateTagRequestSchema>;
export const CreateTagResponseSchema = z.object({
  /** 标签id */
  tagid: z.number().optional(),
});
export type CreateTagResponse = z.infer<typeof CreateTagResponseSchema>;

/**
 * 删除标签
 * @see https://developer.work.weixin.qq.com/document/path/90040
 */
export const DeleteTagRequestSchema = z.object({
  /** 标签ID */
  tagid: z.number(),
});
export type DeleteTagRequest = z.infer<typeof DeleteTagRequestSchema>;

/**
 * 删除标签成员
 * @see https://developer.work.weixin.qq.com/document/path/90043
 */
export const DeleteTagUsersRequestSchema = z.object({
  /** 标签ID */
  tagid: z.number(),
  /** 企业成员ID列表，与partylist不能同时为空 */
  userlist: z.array(z.string()).optional(),
  /** 企业部门ID列表，与userlist不能同时为空 */
  partylist: z.array(z.number()).optional(),
});
export type DeleteTagUsersRequest = z.infer<typeof DeleteTagUsersRequestSchema>;
export const DeleteTagUsersResponseSchema = z.object({
  /** 非法的成员账号列表（用竖线分隔） */
  invalidlist: z.string().optional(),
  /** 非法的部门id列表 */
  invalidparty: z.array(z.number()).optional(),
});
export type DeleteTagUsersResponse = z.infer<typeof DeleteTagUsersResponseSchema>;

/**
 * 获取标签成员
 * @see https://developer.work.weixin.qq.com/document/path/90041
 */
export const GetTagRequestSchema = z.object({
  /** 标签ID */
  tagid: z.string().min(1),
});
export type GetTagRequest = z.infer<typeof GetTagRequestSchema>;
export const GetTagResponseSchema = z.object({
  /** 标签名 */
  tagname: z.string().optional(),
  /** 标签中包含的成员列表 */
  userlist: z.array(z.object({ userid: z.string(), name: z.string() })).optional(),
  /** 标签中包含的部门id列表 */
  partylist: z.array(z.number()).optional(),
});
export type GetTagResponse = z.infer<typeof GetTagResponseSchema>;

export const ListTagResponseSchema = z.object({
  /** 标签列表 */
  taglist: z.array(z.object({ tagid: z.number(), tagname: z.string() })).optional(),
});
export type ListTagResponse = z.infer<typeof ListTagResponseSchema>;

/**
 * 更新标签名字
 * @see https://developer.work.weixin.qq.com/document/path/90039
 */
export const UpdateTagRequestSchema = z.object({
  /** 标签ID */
  tagid: z.number(),
  /** 标签名称，长度限制为32个字（汉字或英文字母），标签不可与其他标签重名 */
  tagname: z.string().min(1).max(32),
});
export type UpdateTagRequest = z.infer<typeof UpdateTagRequestSchema>;

/**
 * 登录二次验证
 * @see https://developer.work.weixin.qq.com/document/path/90031
 */
export const AuthSuccessRequestSchema = z.object({
  /** 成员UserID。对应管理端的账号 */
  userid: z.string().min(1).max(64),
});
export type AuthSuccessRequest = z.infer<typeof AuthSuccessRequestSchema>;

/**
 * 批量删除成员
 * @see https://developer.work.weixin.qq.com/document/path/90027
 */
export const BatchDeleteUserRequestSchema = z.object({
  /** 成员UserID列表。对应管理端的账号。若存在无效UserID，直接返回错误 */
  useridlist: z.array(z.string()),
});
export type BatchDeleteUserRequest = z.infer<typeof BatchDeleteUserRequestSchema>;

/**
 * userid转openid
 * @see https://developer.work.weixin.qq.com/document/path/90030
 */
export const ConvertToOpenIDRequestSchema = z.object({
  /** 企业内的成员id */
  userid: z.string().min(1).max(64),
});
export type ConvertToOpenIDRequest = z.infer<typeof ConvertToOpenIDRequestSchema>;
export const ConvertToOpenIDResponseSchema = z.object({
  /** 企业微信成员userid对应的openid */
  openid: z.string().optional(),
});
export type ConvertToOpenIDResponse = z.infer<typeof ConvertToOpenIDResponseSchema>;

/**
 * 创建成员
 * @see https://developer.work.weixin.qq.com/document/path/90023
 */
export const CreateUserRequestSchema = z.object({
  /** 成员UserID。对应管理端的账号，企业内必须唯一。长度为1~64个字节。只能由数字、字母和"_-@."四种字符组成，且第一个字符必须是数字或字母。系统进行唯一 */
  userid: z.string().min(1).max(64),
  /** 成员名称。长度为1~64个utf8字符 */
  name: z.string().min(1).max(64),
  /** 成员别名。长度1~64个utf8字符 */
  alias: z.string().min(1).max(64).optional(),
  /** 手机号码。企业内必须唯一，mobile/email二者不能同时为空，中国大陆手机号码可省略"+86"，其他国家或地区必须要带上国际码。 */
  mobile: z.string().optional(),
  /** 成员所属部门id列表，不超过100个。当不填写department或id为0时，成员会放在其他（待设置部门）下，当填写的部门不存在时，会在在其他（待设置部门）下 */
  department: z.array(z.number()).optional(),
  /** 部门内的排序值，默认为0，成员次序以创建时间从小到大排列。个数必须和参数department的个数一致，数值越大排序越前面。有效的值范围是[0, 2^32) */
  order: z.array(z.number()).default(0).optional(),
  /** 职务信息。长度为0~128个字符 */
  position: z.string().min(0).max(128).optional(),
  /** 性别。1表示男性，2表示女性 (1-男性, 2-女性) */
  gender: z.number().optional(),
  /** 邮箱。可填写企业已有的邮箱账号，方便同事获取成员的邮箱账号以发邮件。长度6~64个字节，且为有效的email格式。企业内必须唯一，mobile/email二者不 [email] */
  email: z.string().min(6).max(64).optional(),
  /** 如果企业已开通腾讯企业邮（企业微信邮箱），设置该值可创建企业邮箱账号。长度6~64个字节，且为有效的企业邮箱格式。企业内必须唯一。未填写则系统会为用户生成默认企 [email] */
  biz_mail: z.string().min(6).max(64).optional(),
  /** 座机。32字节以内，由纯数字、"-"、"+"或","组成。 */
  telephone: z.string().max(32).optional(),
  /** 个数必须和参数department的个数一致，表示在所在的部门内是否为部门负责人。1表示为部门负责人，0表示非部门负责人。在审批等应用里可以用来标识上级审批人 (1-部门负责人, 0-非部门负责人) */
  is_leader_in_dept: z.number().optional(),
  /** 直属上级UserID，设置范围为企业内成员，可以设置最多1个上级 */
  direct_leader: z.array(z.string()).optional(),
  /** 成员头像的mediaid，通过素材管理接口上传图片获得的mediaid */
  avatar_mediaid: z.string().optional(),
  /** 启用/禁用成员。1表示启用成员，0表示禁用成员 (1-启用, 0-禁用) */
  enable: z.number().optional(),
  /** 扩展属性。扩展属性字段需要先在WEB管理端添加，见扩展属性添加方法，否则忽略未知属性的赋值。 */
  extattr: z.object({ attrs: z.array(z.object({ type: z.number(), name: z.string().min(1).max(64), text: z.object({ value: z.string().min(1).max(5000) }), web: z.object({ url: z.string().min(1).max(5000), title: z.string().min(1).max(5000) }), miniprogram: z.object({ appid: z.string().min(1).max(64), pagepath: z.string().min(1).max(5000), title: z.string().min(1).max(5000) }) })) }).optional(),
  /** 是否邀请该成员使用企业微信（将通过微信服务通知或短信或邮件下发邀请，每天自动下发一次，最多持续3个工作日），默认值为true。 */
  to_invite: z.boolean().default(true).optional(),
  /** 对外职务，如果设置了该值，则以此作为对外展示的职务，否则以position来展示。长度12个汉字内 */
  external_position: z.string().min(0).max(36).optional(),
  /** 成员对外属性，字段详情见对外属性 */
  external_profile: z.object({ external_corp_name: z.string().min(1).max(32), wechat_channels: z.object({ nickname: z.string().min(1).max(32) }), external_attr: z.array(z.object({ type: z.number(), name: z.string().min(1).max(64), text: z.object({ value: z.string().min(1).max(5000) }), web: z.object({ url: z.string().min(1).max(5000), title: z.string().min(1).max(5000) }), miniprogram: z.object({ appid: z.string().min(1).max(64), pagepath: z.string().min(1).max(5000), title: z.string().min(1).max(5000) }) })) }).optional(),
  /** 视频号名字（设置后，成员将对外展示该视频号）。须从企业绑定到企业微信的视频号中选择，可在我的企业页中查看绑定的视频号 */
  nickname: z.string().min(1).max(32).optional(),
  /** 地址。长度最大128个字符 */
  address: z.string().min(0).max(128).optional(),
  /** 主部门 */
  main_department: z.number().min(1).optional(),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export const CreateUserResponseSchema = z.object({
  /** 因填写不存在的部门，新增的部门列表 */
  created_department_list: z.object({ department_info: z.array(z.object({ name: z.string().min(1).max(64), id: z.number().min(1) })) }).optional(),
});
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;

/**
 * 删除成员
 * @see https://developer.work.weixin.qq.com/document/path/90026
 */
export const DeleteUserRequestSchema = z.object({
  /** 成员UserID。对应管理端的帐号 */
  userid: z.string().min(1).max(64),
});
export type DeleteUserRequest = z.infer<typeof DeleteUserRequestSchema>;

/**
 * 读取成员
 * @see https://developer.work.weixin.qq.com/document/path/90024
 */
export const GetUserRequestSchema = z.object({
  /** 成员UserID。对应管理端的账号，企业内必须唯一。不区分大小写，长度为1~64个字节 */
  userid: z.string().min(1).max(64),
});
export type GetUserRequest = z.infer<typeof GetUserRequestSchema>;
export const GetUserResponseSchema = z.object({
  /** 成员UserID。对应管理端的账号，企业内必须唯一。不区分大小写，长度为1~64个字节；第三方应用返回的值为open_userid */
  userid: z.string().min(1).max(64).optional(),
  /** 成员名称 */
  name: z.string().optional(),
  /** 成员所属部门id列表 */
  department: z.array(z.number()).optional(),
  /** 部门内的排序值，默认为0。数量必须和department一致，数值越大排序越前面。值范围是[0, 2^32) */
  order: z.array(z.number()).default(0).optional(),
  /** 职务信息 */
  position: z.string().optional(),
  /** 手机号码 */
  mobile: z.string().optional(),
  /** 性别。0表示未定义，1表示男性，2表示女性 (0-未定义, 1-男性, 2-女性) */
  gender: z.number().optional(),
  /** 邮箱 */
  email: z.string().optional(),
  /** 企业邮箱 */
  biz_mail: z.string().optional(),
  /** 表示在所在的部门内是否为部门负责人，数量与department一致 (0-非负责人, 1-负责人) */
  is_leader_in_dept: z.number().optional(),
  /** 直属上级UserID，返回在应用可见范围内的直属上级列表，最多有1个直属上级 */
  direct_leader: z.array(z.string()).optional(),
  /** 头像url */
  avatar: z.string().optional(),
  /** 头像缩略图url */
  thumb_avatar: z.string().optional(),
  /** 座机 */
  telephone: z.string().optional(),
  /** 别名 */
  alias: z.string().optional(),
  /** 扩展属性 */
  extattr: z.object({ attrs: z.array(z.object({ type: z.number(), name: z.string(), text: z.object({ value: z.string() }), web: z.object({ url: z.string(), title: z.string() }), miniprogram: z.object({ appid: z.string(), pagepath: z.string(), title: z.string() }) })) }).optional(),
  /** 激活状态: 1=已激活，2=已禁用，4=未激活，5=退出企业 (1-已激活, 2-已禁用, 4-未激活, 5-退出企业) */
  status: z.number().optional(),
  /** 员工个人二维码url */
  qr_code: z.string().optional(),
  /** 对外职务 */
  external_position: z.string().optional(),
  /** 成员对外属性 */
  external_profile: z.object({ external_corp_name: z.string(), wechat_channels: z.object({ nickname: z.string(), status: z.number() }), external_attr: z.array(z.object({ type: z.number(), name: z.string(), text: z.object({ value: z.string() }), web: z.object({ url: z.string(), title: z.string() }), miniprogram: z.object({ appid: z.string(), pagepath: z.string(), title: z.string() }) })) }).optional(),
  /** 地址 */
  address: z.string().optional(),
  /** 全局唯一ID，仅第三方应用可获取，最多64个字节 */
  open_userid: z.string().min(1).max(64).optional(),
  /** 主部门，仅当应用对主部门有查看权限时返回 */
  main_department: z.number().min(1).optional(),
});
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;

/**
 * 通过邮箱获取userid
 * @see https://developer.work.weixin.qq.com/document/path/95895
 */
export const GetUserIdByEmailRequestSchema = z.object({
  /** 邮箱 */
  email: z.string(),
  /** 邮箱类型：1-企业邮箱（默认）；2-个人邮箱 (1-企业邮箱, 2-个人邮箱) */
  email_type: z.number().optional(),
});
export type GetUserIdByEmailRequest = z.infer<typeof GetUserIdByEmailRequestSchema>;
export const GetUserIdByEmailResponseSchema = z.object({
  /** 成员UserID。注意：已升级openid的代开发或第三方，获取的是密文userid */
  userid: z.string().optional(),
});
export type GetUserIdByEmailResponse = z.infer<typeof GetUserIdByEmailResponseSchema>;

/**
 * 手机号获取userid
 * @see https://developer.work.weixin.qq.com/document/path/95402
 */
export const GetUserIDByMobileRequestSchema = z.object({
  /** 用户在企业微信通讯录中的手机号码 */
  mobile: z.string().min(5).max(32),
});
export type GetUserIDByMobileRequest = z.infer<typeof GetUserIDByMobileRequestSchema>;
export const GetUserIDByMobileResponseSchema = z.object({
  /** 成员UserID。对应管理端的账号，企业内必须唯一。不区分大小写，长度为1~64个字节。注意：第三方应用获取的值是密文的userid */
  userid: z.string().min(1).max(64).optional(),
});
export type GetUserIDByMobileResponse = z.infer<typeof GetUserIDByMobileResponseSchema>;

/**
 * 获取部门成员详情
 * @see https://developer.work.weixin.qq.com/document/path/90029
 */
export const ListUserRequestSchema = z.object({
  /** 获取的部门id */
  department_id: z.number(),
});
export type ListUserRequest = z.infer<typeof ListUserRequestSchema>;
export const ListUserResponseSchema = z.object({
  /** 成员列表 */
  userlist: z.array(z.object({ userid: z.string(), name: z.string(), department: z.array(z.number()), order: z.array(z.number()), position: z.string(), mobile: z.string(), gender: z.number(), email: z.string(), biz_mail: z.string(), is_leader_in_dept: z.array(z.number()), direct_leader: z.array(z.string()), avatar: z.string(), thumb_avatar: z.string(), telephone: z.string(), alias: z.string(), status: z.number(), address: z.string(), english_name: z.string(), open_userid: z.string(), main_department: z.number(), extattr: z.object({ attrs: z.array(z.object({ type: z.number(), name: z.string(), text: z.object({ value: z.string() }), web: z.object({ url: z.string(), title: z.string() }), miniprogram: z.object({ appid: z.string(), pagepath: z.string(), title: z.string() }) })) }), qr_code: z.string(), external_position: z.string(), external_profile: z.object({ external_corp_name: z.string(), wechat_channels: z.object({ nickname: z.string(), status: z.number() }), external_attr: z.array(z.object({ type: z.number(), name: z.string(), text: z.object({ value: z.string() }), web: z.object({ url: z.string(), title: z.string() }), miniprogram: z.object({ appid: z.string(), pagepath: z.string(), title: z.string() }) })) }) })).optional(),
});
export type ListUserResponse = z.infer<typeof ListUserResponseSchema>;

/**
 * 获取成员ID列表
 * @see https://developer.work.weixin.qq.com/document/path/96070
 */
export const ListUserIdRequestSchema = z.object({
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用不填 */
  cursor: z.string().optional(),
  /** 分页，预期请求的数据量 */
  limit: z.number().min(1).max(10000).optional(),
});
export type ListUserIdRequest = z.infer<typeof ListUserIdRequestSchema>;
export const ListUserIdResponseSchema = z.object({
  /** 分页游标，下次请求时填写以获取之后分页的记录。如果该字段返回空则表示已没有更多数据 */
  next_cursor: z.string().optional(),
  /** 用户-部门关系列表 */
  dept_user: z.array(z.object({ userid: z.string(), department: z.number() })).optional(),
});
export type ListUserIdResponse = z.infer<typeof ListUserIdResponseSchema>;

/**
 * 获取部门成员
 * @see https://developer.work.weixin.qq.com/document/path/90028
 */
export const SimpleListUserRequestSchema = z.object({
  /** 获取的部门id */
  department_id: z.number(),
});
export type SimpleListUserRequest = z.infer<typeof SimpleListUserRequestSchema>;
export const SimpleListUserResponseSchema = z.object({
  /** 成员列表 */
  userlist: z.array(z.object({ userid: z.string(), name: z.string(), department: z.array(z.number()), open_userid: z.string().max(64) })).optional(),
});
export type SimpleListUserResponse = z.infer<typeof SimpleListUserResponseSchema>;

/**
 * 更新成员
 * @see https://developer.work.weixin.qq.com/document/path/90025
 */
export const UpdateUserRequestSchema = z.object({
  /** 成员UserID。对应管理端的账号，企业内必须唯一。不区分大小写，长度为1~64个字节 */
  userid: z.string().min(1).max(64),
  /** 成员名称。长度为1~64个utf8字符 */
  name: z.string().min(1).max(64).optional(),
  /** 别名。长度为1-64个utf8字符 */
  alias: z.string().min(1).max(64).optional(),
  /** 手机号码。企业内必须唯一。若成员已激活企业微信，则需成员自行修改（此情况下该参数被忽略，但不会报错），中国大陆手机号码可省略“+86”，其他国家或地区必须要带上 */
  mobile: z.string().optional(),
  /** 成员所属部门id列表，不超过100个 */
  department: z.array(z.number()).optional(),
  /** 部门内的排序值，默认为0。当有传入department时有效。数量必须和department一致，数值越大排序越前面。有效的值范围是[0, 2^32) */
  order: z.array(z.number()).default(0).optional(),
  /** 职务信息。长度为0~128个utf8字符 */
  position: z.string().min(0).max(128).optional(),
  /** 性别。1表示男性，2表示女性 (1-男性, 2-女性) */
  gender: z.number().optional(),
  /** 邮箱。可填写企业已有的邮箱账号，方便同事获取成员的邮箱账号以发邮件。长度6~64个字节，且为有效的email格式。企业内必须唯一。境外成员可用此邮箱登录企业微信 */
  email: z.string().min(6).max(64).optional(),
  /** 如果企业已开通腾讯企业邮（企业微信邮箱），设置该值可创建企业邮箱账号。长度6~63个字节，且为有效的企业邮箱格式。企业内必须唯一。未填写则系统会为用户生成默认企 */
  biz_mail: z.string().min(6).max(63).optional(),
  /** 企业邮箱别名。长度6~63个字节，且为有效的企业邮箱格式。企业内必须唯一，最多可设置5个别名。更新时为覆盖式更新。传空结构或传空数组会清空当前企业邮箱别名。 */
  biz_mail_alias: z.object({ item: z.array(z.string()) }).optional(),
  /** 座机。由1-32位的纯数字、“-”、“+”或“,”组成 */
  telephone: z.string().min(1).max(32).optional(),
  /** 部门负责人字段，个数必须和department一致，表示在所在的部门内是否为负责人。0-否，1-是 (0-否, 1-是) */
  is_leader_in_dept: z.number().optional(),
  /** 直属上级，可以设置企业范围内成员为直属上级，最多设置1个 */
  direct_leader: z.array(z.string()).optional(),
  /** 成员头像的mediaid，通过素材管理接口上传图片获得的mediaid */
  avatar_mediaid: z.string().optional(),
  /** 启用/禁用成员。1表示启用成员，0表示禁用成员 (0-禁用, 1-启用) */
  enable: z.number().optional(),
  /** 扩展属性。扩展属性字段需要先在WEB管理端添加，否则忽略未知属性的赋值。 */
  extattr: z.object({ attrs: z.array(z.object({ type: z.number(), name: z.string(), text: z.object({ value: z.string() }), web: z.object({ url: z.string(), title: z.string() }), miniprogram: z.object({ appid: z.string(), pagepath: z.string(), title: z.string() }) })) }).optional(),
  /** 成员对外属性，字段详情见[对外属性](#13450) */
  external_profile: z.object({ external_corp_name: z.string(), wechat_channels: z.object({ nickname: z.string() }), external_attr: z.array(z.object({ type: z.number(), name: z.string(), text: z.object({ value: z.string() }), web: z.object({ url: z.string(), title: z.string() }), miniprogram: z.object({ appid: z.string(), pagepath: z.string(), title: z.string() }) })) }).optional(),
  /** 对外职务，如果设置了该值，则以此作为对外展示的职务，否则以position来展示。不超过12个汉字 */
  external_position: z.string().max(36).optional(),
  /** 视频号名字（设置后，成员将对外展示该视频号）。须从企业绑定到企业微信的视频号中选择，可在“我的企业”页中查看绑定的视频号 */
  nickname: z.string().optional(),
  /** 地址。长度最大128个字符 */
  address: z.string().max(128).optional(),
  /** 主部门 */
  main_department: z.number().optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

