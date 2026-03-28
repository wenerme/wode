// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 外部联系人openid转换
 * @see https://developer.work.weixin.qq.com/document/path/92323
 */
export const ConvertToOpenidRequestSchema = z.object({
  /** 外部联系人的userid，注意不是企业成员的账号 */
  external_userid: z.string().min(1).max(128),
});
export type ConvertToOpenidRequest = z.infer<typeof ConvertToOpenidRequestSchema>;
export const ConvertToOpenidResponseSchema = z.object({
  /** 该企业的外部联系人openid */
  openid: z.string().optional(),
});
export type ConvertToOpenidResponse = z.infer<typeof ConvertToOpenidResponseSchema>;

export const GetSubscribeQrCodeResponseSchema = z.object({
  /** 1200px的大尺寸二维码 */
  qrcode_big: z.string().optional(),
  /** 430px的中尺寸二维码 */
  qrcode_middle: z.string().optional(),
  /** 258px的小尺寸二维码 */
  qrcode_thumb: z.string().optional(),
});
export type GetSubscribeQrCodeResponse = z.infer<typeof GetSubscribeQrCodeResponseSchema>;

/**
 * 设置关注「学校通知」的模式
 * @see https://developer.work.weixin.qq.com/document/path/92318
 */
export const SetExternalContactSubscribeModeRequestSchema = z.object({
  /** 关注模式。1:可扫码填写资料加入，2:禁止扫码填写资料加入 (1-可扫码填写资料加入, 2-禁止扫码填写资料加入) */
  subscribe_mode: z.number(),
});
export type SetExternalContactSubscribeModeRequest = z.infer<typeof SetExternalContactSubscribeModeRequestSchema>;

/**
 * 获取可使用的家长范围
 * @see https://developer.work.weixin.qq.com/document/path/94895
 */
export const GetSchoolAgentAllowScopeRequestSchema = z.object({
  /** 应用id */
  agentid: z.number(),
});
export type GetSchoolAgentAllowScopeRequest = z.infer<typeof GetSchoolAgentAllowScopeRequestSchema>;
export const GetSchoolAgentAllowScopeResponseSchema = z.object({
  /** 可在微信学校通知中该应用的家长范围 */
  allow_scope: z.object({ students: z.object({ userid: z.array(z.string()) }), departments: z.object({ partyid: z.array(z.number()) }) }).optional(),
});
export type GetSchoolAgentAllowScopeResponse = z.infer<typeof GetSchoolAgentAllowScopeResponseSchema>;

/**
 * 获取部门列表
 * @see https://developer.work.weixin.qq.com/document/path/92343
 */
export const ListSchoolDepartmentRequestSchema = z.object({
  /** 部门id。获取指定部门及其下的子部门。如果不填，默认获取全量组织架构 */
  id: z.number().optional(),
});
export type ListSchoolDepartmentRequest = z.infer<typeof ListSchoolDepartmentRequestSchema>;
export const ListSchoolDepartmentResponseSchema = z.object({
  /** 部门列表数据 */
  departments: z.array(z.object({ id: z.number(), name: z.string(), parentid: z.number(), type: z.number(), register_year: z.number(), standard_grade: z.number(), order: z.number(), department_admins: z.array(z.object({ userid: z.string(), type: z.number(), subject: z.string() })), is_graduated: z.number(), open_group_chat: z.number(), group_chat_id: z.string() })).optional(),
});
export type ListSchoolDepartmentResponse = z.infer<typeof ListSchoolDepartmentResponseSchema>;

/**
 * 更新部门
 * @see https://developer.work.weixin.qq.com/document/path/92341
 */
export const UpdateSchoolDepartmentRequestSchema = z.object({
  /** 部门名称，如果部门为标准年级则忽略该字段。长度限制为1~32个字符，字符不能包括-\:*?"<>/ */
  name: z.string().min(1).max(32).optional(),
  /** 父部门id，32位整型 */
  parentid: z.number().min(0).max(4294967295).optional(),
  /** 部门id，32位整型，必须大于0 */
  id: z.number().min(1).max(4294967295),
  /** 修改为新的id */
  new_id: z.number().min(1).max(4294967295).optional(),
  /** 入学年份，32位整型，格式为YYYY，输入范围为1970～2100，仅当部门类型为年级（2）时生效 */
  register_year: z.number().min(1970).max(2100).optional(),
  /** 标准年级，32位整型，参数值含义详见标准年级对照表，仅当部门类型为年级（2）时生效。传入0表示将此部门转换为非标准年级 */
  standard_grade: z.number().min(0).max(4294967295).optional(),
  /** 在父部门中的次序值。order值大的排序靠前。有效的值范围是[0, 2^32) */
  order: z.number().min(0).max(4294967295).optional(),
  /** 部门管理员列表 */
  department_admins: z.array(z.object({ op: z.number(), userid: z.string().min(1).max(64), type: z.number(), subject: z.string().max(15) })).optional(),
});
export type UpdateSchoolDepartmentRequest = z.infer<typeof UpdateSchoolDepartmentRequestSchema>;

/**
 * 获取家校访问用户身份
 * @see https://developer.work.weixin.qq.com/document/path/95791
 */
export const GetSchoolUserInfoRequestSchema = z.object({
  /** 通过成员授权获取到的code，最大为512字节。每次成员授权带上的code将不一样，code只能使用一次，5分钟未被使用自动过期。 */
  code: z.string().max(512),
});
export type GetSchoolUserInfoRequest = z.infer<typeof GetSchoolUserInfoRequestSchema>;
export const GetSchoolUserInfoResponseSchema = z.object({
  /** 手机设备号(由企业微信在安装时随机生成，删除重装会改变，升级不受影响) */
  DeviceId: z.string().optional(),
  /** 家校通讯录里家长的userid */
  parent_userid: z.string().optional(),
  /** 家校通讯录里学生的userid */
  student_userid: z.string().optional(),
});
export type GetSchoolUserInfoResponse = z.infer<typeof GetSchoolUserInfoResponseSchema>;

/**
 * 设置家校通讯录自动同步模式
 * @see https://developer.work.weixin.qq.com/document/path/92345
 */
export const SetArchSyncModeRequestSchema = z.object({
  /** 家校通讯录同步模式：1-禁止将标签同步至家校通讯录，2-禁止将家校通讯录同步至标签，3-禁止家校通讯录和标签相互同步 (1-禁止将标签同步至家校通讯录, 2-禁止将家校通讯录同步至标签, 3-禁止家校通讯录和标签相互同步) */
  arch_sync_mode: z.number(),
});
export type SetArchSyncModeRequest = z.infer<typeof SetArchSyncModeRequestSchema>;

/**
 * 修改自动升年级的配置
 * @see https://developer.work.weixin.qq.com/document/path/92949
 */
export const SetSchoolUpgradeInfoRequestSchema = z.object({
  /** 自动升年级的时间，该时间戳只有月和日有效。不传则默认为0（代表1月1号） [timestamp] */
  upgrade_time: z.number().default(0).optional(),
  /** 开启或关闭自动升年级。0：表示关闭，1：表示开启。不传默认关闭，传所有非1的值也视为关闭 (0-关闭, 1-开启) */
  upgrade_switch: z.number().optional(),
});
export type SetSchoolUpgradeInfoRequest = z.infer<typeof SetSchoolUpgradeInfoRequestSchema>;
export const SetSchoolUpgradeInfoResponseSchema = z.object({
  /** 下次升级的时间，只有年月日有效。如果该学校今年已经升过年级，则给明年对应日期的时间戳 [timestamp] */
  next_upgrade_time: z.number().optional(),
});
export type SetSchoolUpgradeInfoResponse = z.infer<typeof SetSchoolUpgradeInfoResponseSchema>;

/**
 * 批量创建家长
 * @see https://developer.work.weixin.qq.com/document/path/92334
 */
export const BatchCreateParentRequestSchema = z.object({
  /** 家长列表，每次最多100个 */
  parents: z.array(z.object({ parent_userid: z.string().min(1).max(64), mobile: z.string().min(11).max(11), to_invite: z.boolean().default(true), children: z.array(z.object({ student_userid: z.string().min(1).max(64), relation: z.string().min(1).max(32) })) })),
});
export type BatchCreateParentRequest = z.infer<typeof BatchCreateParentRequestSchema>;
export const BatchCreateParentResponseSchema = z.object({
  /** 失败列表 */
  result_list: z.array(z.object({ parent_userid: z.string(), errcode: z.number(), errmsg: z.string() })).optional(),
});
export type BatchCreateParentResponse = z.infer<typeof BatchCreateParentResponseSchema>;

/**
 * 批量创建学生
 * @see https://developer.work.weixin.qq.com/document/path/92328
 */
export const BatchCreateStudentRequestSchema = z.object({
  /** 学生列表，每次最多100个学生 */
  students: z.array(z.object({ student_userid: z.string().min(1).max(64), mobile: z.string().min(0).max(0), to_invite: z.boolean().default(true), name: z.string().min(1).max(32), department: z.array(z.number()) })),
});
export type BatchCreateStudentRequest = z.infer<typeof BatchCreateStudentRequestSchema>;
export const BatchCreateStudentResponseSchema = z.object({
  /** 失败的学生列表 */
  result_list: z.array(z.object({ student_userid: z.string(), errcode: z.number(), errmsg: z.string() })).optional(),
});
export type BatchCreateStudentResponse = z.infer<typeof BatchCreateStudentResponseSchema>;

/**
 * 批量删除家长
 * @see https://developer.work.weixin.qq.com/document/path/92335
 */
export const BatchDeleteParentRequestSchema = z.object({
  /** 家长的userid列表，每次最多100个 */
  useridlist: z.array(z.string()),
});
export type BatchDeleteParentRequest = z.infer<typeof BatchDeleteParentRequestSchema>;
export const BatchDeleteParentResponseSchema = z.object({
  /** 批量操作结果 */
  result_list: z.array(z.object({ parent_userid: z.string(), errcode: z.number(), errmsg: z.string() })).optional(),
});
export type BatchDeleteParentResponse = z.infer<typeof BatchDeleteParentResponseSchema>;

/**
 * 批量删除学生
 * @see https://developer.work.weixin.qq.com/document/path/92329
 */
export const BatchDeleteSchoolStudentRequestSchema = z.object({
  /** 学生的userid列表，每次最多100个 */
  useridlist: z.array(z.string()),
});
export type BatchDeleteSchoolStudentRequest = z.infer<typeof BatchDeleteSchoolStudentRequestSchema>;
export const BatchDeleteSchoolStudentResponseSchema = z.object({
  /** 批量操作结果 */
  result_list: z.array(z.object({ student_userid: z.string(), errcode: z.number(), errmsg: z.string() })).optional(),
});
export type BatchDeleteSchoolStudentResponse = z.infer<typeof BatchDeleteSchoolStudentResponseSchema>;

/**
 * 批量更新家长
 * @see https://developer.work.weixin.qq.com/document/path/92336
 */
export const BatchUpdateParentRequestSchema = z.object({
  /** 家长列表，每次最多100个 */
  parents: z.array(z.object({ parent_userid: z.string().min(1).max(64), new_parent_userid: z.string().min(1).max(64), mobile: z.string().min(1).max(64), children: z.array(z.object({ student_userid: z.string().min(1).max(64), relation: z.string().min(1).max(32) })) })).optional(),
});
export type BatchUpdateParentRequest = z.infer<typeof BatchUpdateParentRequestSchema>;
export const BatchUpdateParentResponseSchema = z.object({
  /** 失败的家长列表 */
  result_list: z.array(z.object({ parent_userid: z.string(), errcode: z.number(), errmsg: z.string() })).optional(),
});
export type BatchUpdateParentResponse = z.infer<typeof BatchUpdateParentResponseSchema>;

/**
 * 批量更新学生
 * @see https://developer.work.weixin.qq.com/document/path/92330
 */
export const BatchUpdateStudentRequestSchema = z.object({
  /** 学生列表，每次最多100个 */
  students: z.array(z.object({ student_userid: z.string().min(1).max(64), mobile: z.string().min(0), new_student_userid: z.string().min(1).max(64), name: z.string().min(1).max(32), department: z.array(z.number()) })).optional(),
});
export type BatchUpdateStudentRequest = z.infer<typeof BatchUpdateStudentRequestSchema>;
export const BatchUpdateStudentResponseSchema = z.object({
  /** 失败的学生列表 */
  result_list: z.array(z.object({ student_userid: z.string(), errcode: z.number(), errmsg: z.string() })).optional(),
});
export type BatchUpdateStudentResponse = z.infer<typeof BatchUpdateStudentResponseSchema>;

/**
 * 创建家长
 * @see https://developer.work.weixin.qq.com/document/path/92331
 */
export const CreateParentUserRequestSchema = z.object({
  /** 家长UserID。学校内必须唯一，不区分大小写，长度为1~64个字节。只能由数字、字母和"_-@."四种字符组成，且第一个字符必须是数字或字母。 */
  parent_userid: z.string().min(1).max(64),
  /** 家长手机号 */
  mobile: z.string(),
  /** 是否发起邀请，默认为true，仅验证的学校才能发起邀请。 */
  to_invite: z.boolean().default(true).optional(),
  /** 家长的孩子列表，最多10个 */
  children: z.array(z.object({ student_userid: z.string().min(1).max(64), relation: z.string().min(1).max(32) })),
});
export type CreateParentUserRequest = z.infer<typeof CreateParentUserRequestSchema>;

/**
 * 创建学生
 * @see https://developer.work.weixin.qq.com/document/path/92325
 */
export const CreateStudentRequestSchema = z.object({
  /** 学生UserID。学校内必须唯一，不区分大小写，长度为1~64个字节。只能由数字、字母和“_-@.”四种字符组成，且第一个字符必须是数字或字母。 */
  student_userid: z.string().min(1).max(64),
  /** 学生手机号 */
  mobile: z.string().optional(),
  /** 是否发起邀请，默认为true。仅验证的学校才能发起邀请。 */
  to_invite: z.boolean().default(true).optional(),
  /** 学生姓名，长度为1~32个字符。 */
  name: z.string().min(1).max(32),
  /** 学生所在的班级id列表，不超过20个。 */
  department: z.array(z.number()),
});
export type CreateStudentRequest = z.infer<typeof CreateStudentRequestSchema>;

/**
 * 删除家长
 * @see https://developer.work.weixin.qq.com/document/path/92332
 */
export const DeleteParentRequestSchema = z.object({
  /** 家校通信录中家长的userid */
  userid: z.string().min(1).max(64),
});
export type DeleteParentRequest = z.infer<typeof DeleteParentRequestSchema>;

/**
 * 删除学生
 * @see https://developer.work.weixin.qq.com/document/path/92326
 */
export const DeleteStudentRequestSchema = z.object({
  /** 家校通信录中学生的userid */
  userid: z.string().min(1).max(64),
});
export type DeleteStudentRequest = z.infer<typeof DeleteStudentRequestSchema>;

/**
 * 读取学生或家长
 * @see https://developer.work.weixin.qq.com/document/path/92337
 */
export const GetSchoolUserRequestSchema = z.object({
  /** 家校通讯录的userid，家长或者学生的userid。不区分大小写，长度为1~64个字节 */
  userid: z.string().min(1).max(64),
});
export type GetSchoolUserRequest = z.infer<typeof GetSchoolUserRequestSchema>;
export const GetSchoolUserResponseSchema = z.object({
  /** 用户类型:1表示学生，2表示家长 (1-学生, 2-家长) */
  user_type: z.number().optional(),
  /** 学生字段，user_type为1时返回该字段 */
  student: z.object({ student_userid: z.string(), name: z.string(), department: z.array(z.number()), parents: z.array(z.object({ parent_userid: z.string(), relation: z.string(), mobile: z.string(), is_subscribe: z.number(), external_userid: z.string() })) }).optional(),
  /** 学生家长，user_type为2时返回该字段 */
  parent: z.object({ parent_userid: z.string(), mobile: z.string(), is_subscribe: z.number(), external_userid: z.string(), children: z.array(z.object({ student_userid: z.string(), relation: z.string() })) }).optional(),
});
export type GetSchoolUserResponse = z.infer<typeof GetSchoolUserResponseSchema>;

/**
 * 获取部门学生详情
 * @see https://developer.work.weixin.qq.com/document/path/96119
 */
export const ListSchoolUserRequestSchema = z.object({
  /** 获取的部门id */
  department_id: z.number(),
});
export type ListSchoolUserRequest = z.infer<typeof ListSchoolUserRequestSchema>;
export const ListSchoolUserResponseSchema = z.object({
  /** 学生列表 */
  students: z.array(z.object({ student_userid: z.string(), name: z.string(), department: z.array(z.number()), parents: z.array(z.object({ parent_userid: z.string(), relation: z.string(), mobile: z.string(), is_subscribe: z.number(), external_userid: z.string() })) })).optional(),
});
export type ListSchoolUserResponse = z.infer<typeof ListSchoolUserResponseSchema>;

/**
 * 获取部门家长详情
 * @see https://developer.work.weixin.qq.com/document/path/92446
 */
export const ListSchoolParentRequestSchema = z.object({
  /** 获取的部门id */
  department_id: z.number(),
});
export type ListSchoolParentRequest = z.infer<typeof ListSchoolParentRequestSchema>;
export const ListSchoolParentResponseSchema = z.object({
  /** 家长列表 */
  parents: z.array(z.object({ parent_userid: z.string(), mobile: z.string(), is_subscribe: z.number(), external_userid: z.string(), children: z.array(z.object({ student_userid: z.string(), relation: z.string(), name: z.string() })) })).optional(),
});
export type ListSchoolParentResponse = z.infer<typeof ListSchoolParentResponseSchema>;

/**
 * 更新家长
 * @see https://developer.work.weixin.qq.com/document/path/92333
 */
export const UpdateParentRequestSchema = z.object({
  /** 家长UserID。学校内必须唯一。不区分大小写，长度为1~64个字节。只能由数字、字母和"_-@."四种字符组成，且第一个字符必须是数字或字母。 */
  parent_userid: z.string().min(1).max(64),
  /** 更新的家长UserID。不能与已经存在的家长UserID相同。每个家长仅能更新一次。 */
  new_parent_userid: z.string().min(1).max(64).optional(),
  /** 家长手机号 */
  mobile: z.string().min(11).max(11).optional(),
  /** 家长的孩子列表，该字段是全量更新，如果孩子列表为空则忽略该字段，最多10个 */
  children: z.array(z.object({ student_userid: z.string().min(1).max(64), relation: z.string().min(1).max(32) })).optional(),
});
export type UpdateParentRequest = z.infer<typeof UpdateParentRequestSchema>;

/**
 * 更新学生
 * @see https://developer.work.weixin.qq.com/document/path/92327
 */
export const UpdateStudentRequestSchema = z.object({
  /** 学生UserID。学校内必须唯一。不区分大小写，长度为1~64个字节。只能由数字、字母和"_-@."四种字符组成，且第一个字符必须是数字或字母。 */
  student_userid: z.string().min(1).max(64),
  /** 学生手机号 */
  mobile: z.string().optional(),
  /** 要变更的学生UserID，不能与已存在的UserID相同。每个学生仅能修改一次。 */
  new_student_userid: z.string().min(1).max(64).optional(),
  /** 学生姓名，长度为1~32个字符 */
  name: z.string().min(1).max(32).optional(),
  /** 学生所在的班级id列表，不超过20个 */
  department: z.array(z.number()).optional(),
});
export type UpdateStudentRequest = z.infer<typeof UpdateStudentRequestSchema>;

