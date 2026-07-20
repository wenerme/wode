// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 创建专区程序调用任务
 * @see https://developer.work.weixin.qq.com/document/path/99966
 */
export const CreateProgramTaskRequestSchema = z.object({
  /** 应用关联的程序id */
  program_id: z.string().min(1),
  /** 程序关联的能力id */
  ability_id: z.string().min(1),
  /** 请求的输入JSON，要求与配置的格式匹配 [json_string] */
  request_data: z.string().min(1),
});
export type CreateProgramTaskRequest = z.infer<typeof CreateProgramTaskRequestSchema>;
export const CreateProgramTaskResponseSchema = z.object({
  /** 任务id */
  jobid: z.string().optional(),
});
export type CreateProgramTaskResponse = z.infer<typeof CreateProgramTaskResponseSchema>;

/**
 * 获取专区调试模式状态
 * @see https://developer.work.weixin.qq.com/document/path/100113
 */
export const CheckDebugModeRequestSchema = z.object({
  /** 应用关联的程序id */
  program_id: z.string(),
});
export type CheckDebugModeRequest = z.infer<typeof CheckDebugModeRequestSchema>;
export const CheckDebugModeResponseSchema = z.object({
  /** 程序当前的调试模式状态，1为关闭，2为开启 (1-关闭, 2-开启) */
  debug_mode_status: z.number().optional(),
});
export type CheckDebugModeResponse = z.infer<typeof CheckDebugModeResponseSchema>;

/**
 * 关闭专区调试模式
 * @see https://developer.work.weixin.qq.com/document/path/100088
 */
export const CloseDebugModeRequestSchema = z.object({
  /** 应用关联的程序id */
  program_id: z.string(),
});
export type CloseDebugModeRequest = z.infer<typeof CloseDebugModeRequestSchema>;

/**
 * 获取授权存档的成员列表
 * @see https://developer.work.weixin.qq.com/document/path/99962
 */
export const GetAuthUserListRequestSchema = z.object({
  /** 上一次调用时返回的next_cursor，第一次拉取可以不填 */
  cursor: z.string().optional(),
  /** 本次查询返回的最大条数 */
  limit: z.number().max(1000).default(200).optional(),
});
export type GetAuthUserListRequest = z.infer<typeof GetAuthUserListRequestSchema>;
export const GetAuthUserListResponseSchema = z.object({
  /** 生效成员列表 */
  auth_user_list: z.array(z.object({ userid: z.string(), edition_list: z.number() })).optional(),
  /** 下一次查询时使用，将值填到请求包的cursor字段中 */
  next_cursor: z.string().optional(),
  /** 是否还有更多未拉取的数据，1：是；0：否 (1-是, 0-否) */
  has_more: z.number().optional(),
});
export type GetAuthUserListResponse = z.infer<typeof GetAuthUserListResponseSchema>;

/**
 * 开启专区调试模式
 * @see https://developer.work.weixin.qq.com/document/path/100087
 */
export const OpenChatDataDebugModeRequestSchema = z.object({
  /** 应用关联的程序id */
  program_id: z.string(),
  /** 程序的调试凭证 */
  debug_token: z.string(),
});
export type OpenChatDataDebugModeRequest = z.infer<typeof OpenChatDataDebugModeRequestSchema>;

/**
 * 设置成员会话组件敏感信息隐藏配置
 * @see https://developer.work.weixin.qq.com/document/path/100139
 */
export const SetChatdataHideSensitiveInfoConfigRequestSchema = z.object({
  /** 成员的userid */
  userid: z.string().min(1),
  /** 敏感信息隐藏配置 */
  config: z.object({ hide_mobile: z.boolean().default(false), hide_idcard: z.boolean().default(false), hide_bankno: z.boolean().default(false) }),
});
export type SetChatdataHideSensitiveInfoConfigRequest = z.infer<typeof SetChatdataHideSensitiveInfoConfigRequestSchema>;

/**
 * 设置日志打印级别
 * @see https://developer.work.weixin.qq.com/document/path/100108
 */
export const SetLogLevelRequestSchema = z.object({
  /** 应用关联的程序id */
  program_id: z.string().min(1),
  /** 日志级别。指定后，仅会存储不高于该级别的日志。例如指定级别为2，那么只会存储级别为1或2的日志 (1-ERR, 2-INFO, 3-DBG) */
  log_level: z.number(),
});
export type SetLogLevelRequest = z.infer<typeof SetLogLevelRequestSchema>;

/**
 * 设置公钥
 * @see https://developer.work.weixin.qq.com/document/path/99961
 */
export const SetPublicKeyRequestSchema = z.object({
  /** 开发者为该企业生成的公钥（RSA-2048），PEM格式，需转义换行符 [pem_rsa] */
  public_key: z.string(),
  /** 公钥对应的版本号，更换公钥时要求比旧公钥版本号大 */
  public_key_ver: z.number().min(1),
});
export type SetPublicKeyRequest = z.infer<typeof SetPublicKeyRequestSchema>;

/**
 * 设置专区接收回调事件
 * @see https://developer.work.weixin.qq.com/document/path/99963
 */
export const SetReceiveCallbackRequestSchema = z.object({
  /** 应用关联的程序id，同一个应用只能设置一个程序接收。若先设置了程序A接收，再调用该接口设置程序B时，会更改为程序B接收 */
  program_id: z.string().min(1),
});
export type SetReceiveCallbackRequest = z.infer<typeof SetReceiveCallbackRequestSchema>;

/**
 * 应用同步调用专区程序
 * @see https://developer.work.weixin.qq.com/document/path/99965
 */
export const SyncCallProgramRequestSchema = z.object({
  /** 应用关联的程序id */
  program_id: z.string(),
  /** 程序关联的能力id */
  ability_id: z.string(),
  /** 通知id。由专区通知应用返回 */
  notify_id: z.string().optional(),
  /** 请求的输入JSON，要求与配置的输入协议格式匹配 [json_string] */
  request_data: z.string().min(1),
});
export type SyncCallProgramRequest = z.infer<typeof SyncCallProgramRequestSchema>;
export const SyncCallProgramResponseSchema = z.object({
  /** 专区程序的输出结果，为自定义的JSON字符串，要求与管理端配置的输出协议格式匹配 [json_string] */
  response_data: z.string().optional(),
});
export type SyncCallProgramResponse = z.infer<typeof SyncCallProgramResponseSchema>;

/**
 * 上传临时文件到专区
 * @see https://developer.work.weixin.qq.com/document/path/100174
 */
export const UploadChatDataMediaRequestSchema = z.object({
  /** 文件类型，目前仅支持普通文件：file (file-普通文件) */
  type: z.string(),
  /** 上传的文件 (multipart/form-data) */
  media: z.object({ filename: z.string(), filelength: z.number(), content_type: z.string() }),
});
export type UploadChatDataMediaRequest = z.infer<typeof UploadChatDataMediaRequestSchema>;
export const UploadChatDataMediaResponseSchema = z.object({
  /** 文件类型，目前仅支持普通文件：file */
  type: z.string().optional(),
  /** 文件上传后获取的唯一标识，3天内有效 */
  media_id: z.string().optional(),
  /** 文件上传时间戳 */
  created_at: z.number().optional(),
});
export type UploadChatDataMediaResponse = z.infer<typeof UploadChatDataMediaResponseSchema>;

