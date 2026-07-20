// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取指定的应用详情
 * @see https://developer.work.weixin.qq.com/document/path/90052
 */
export const GetAgentRequestSchema = z.object({
  /** 应用id */
  agentid: z.number(),
});
export type GetAgentRequest = z.infer<typeof GetAgentRequestSchema>;
export const GetAgentResponseSchema = z.object({
  /** 企业应用id */
  agentid: z.number().optional(),
  /** 企业应用名称 */
  name: z.string().optional(),
  /** 企业应用方形头像url */
  square_logo_url: z.string().optional(),
  /** 企业应用详情 */
  description: z.string().optional(),
  /** 可见范围（人员） */
  allow_userinfos: z.object({ user: z.array(z.object({ userid: z.string() })) }).optional(),
  /** 可见范围（部门） */
  allow_partys: z.object({ partyid: z.array(z.number()) }).optional(),
  /** 可见范围（标签） */
  allow_tags: z.object({ tagid: z.array(z.number()) }).optional(),
  /** 应用是否被停用。0：未被停用；1：被停用 (0-未被停用, 1-被停用) */
  close: z.number().optional(),
  /** 企业应用可信域名 */
  redirect_domain: z.string().optional(),
  /** 地理位置上报开关。0：不上报；1：进入会话上报 (0-不上报, 1-进入会话上报) */
  report_location_flag: z.number().optional(),
  /** 是否上报用户进入应用事件。0：不接收；1：接收 (0-不接收, 1-接收) */
  isreportenter: z.number().optional(),
  /** 应用主页url */
  home_url: z.string().optional(),
  /** 代开发自建应用发布状态。0：待开发；1：开发中；2：已上线；3：存在未上线版本 (0-待开发, 1-开发中, 2-已上线, 3-存在未上线版本) */
  customized_publish_status: z.number().optional(),
});
export type GetAgentResponse = z.infer<typeof GetAgentResponseSchema>;

/**
 * 设置应用
 * @see https://developer.work.weixin.qq.com/document/path/90053
 */
export const SetAgentRequestSchema = z.object({
  /** 企业应用的id */
  agentid: z.number(),
  /** 企业应用是否打开地理位置上报 0：不上报；1：进入会话上报 (0-不上报, 1-进入会话上报) */
  report_location_flag: z.number().optional(),
  /** 企业应用头像的mediaid，通过素材管理接口上传图片获得mediaid，上传后会自动裁剪成方形和圆形两个头像 */
  logo_mediaid: z.string().optional(),
  /** 企业应用名称，长度不超过32个utf8字符 */
  name: z.string().max(32).optional(),
  /** 企业应用详情，长度为4至120个utf8字符 */
  description: z.string().min(4).max(120).optional(),
  /** 企业应用可信域名。注意：域名需通过所有权校验，否则jssdk功能将受限 */
  redirect_domain: z.string().optional(),
  /** 是否上报用户进入应用事件。0：不接收；1：接收 (0-不接收, 1-接收) */
  isreportenter: z.number().optional(),
  /** 应用主页url。url必须以http或者https开头（为了提高安全性，建议使用https） */
  home_url: z.string().optional(),
});
export type SetAgentRequest = z.infer<typeof SetAgentRequestSchema>;

/**
 * 设置应用在工作台展示的模版
 * @see https://developer.work.weixin.qq.com/document/path/92536
 */
export const SetWorkbenchTemplateRequestSchema = z.object({
  /** 模版类型，支持 keydata、image、list、webview。若为 normal，则切换为普通展示模式 (keydata-关键数据型, image-图片型, list-列表型, webview-webview型, nor...) */
  type: z.string(),
  /** 应用id */
  agentid: z.number().min(1),
  /** 若type为keydata，设置关键数据型模版数据。包含items数组 */
  keydata: z.object({ items: z.array(z.object({ key: z.string().min(1).max(64), data: z.string().min(1).max(64), jump_url: z.string().min(1).max(1024), pagepath: z.string().min(1).max(1024) })) }).optional(),
  /** 若type为image，设置图片型模版数据。包含url和跳转地址 */
  image: z.object({ url: z.string().min(1), jump_url: z.string().min(1).max(1024), pagepath: z.string().min(1).max(1024) }).optional(),
  /** 若type为list，设置列表型模版数据。包含items数组 */
  list: z.object({ items: z.array(z.object({ title: z.string().min(1).max(128), jump_url: z.string().min(1).max(1024), pagepath: z.string().min(1).max(1024) })) }).optional(),
  /** 若type为webview，设置webview型模版数据 */
  webview: z.object({ url: z.string().min(1), jump_url: z.string().min(1).max(1024), pagepath: z.string().min(1).max(1024), height: z.string(), hide_title: z.boolean(), enable_webview_click: z.boolean() }).optional(),
  /** 是否覆盖用户工作台的数据。true为覆盖，false不覆盖。默认值为false (true-是, false-否) */
  replace_user_data: z.boolean().optional(),
});
export type SetWorkbenchTemplateRequest = z.infer<typeof SetWorkbenchTemplateRequestSchema>;

/**
 * 创建菜单
 * @see https://developer.work.weixin.qq.com/document/path/90055
 */
export const CreateMenuRequestSchema = z.object({
  /** 一级菜单数组，个数应为1~3个 */
  button: z.array(z.object({ type: z.string(), name: z.string().min(1).max(16), key: z.string().min(0).max(128), url: z.string().min(0).max(1024), pagepath: z.string().min(0), appid: z.string().min(0), sub_button: z.array(z.object({ type: z.string(), name: z.string().min(1).max(40), key: z.string().min(0).max(128), url: z.string().min(0).max(1024), pagepath: z.string().min(0), appid: z.string().min(0) })) })),
});
export type CreateMenuRequest = z.infer<typeof CreateMenuRequestSchema>;

/**
 * 删除菜单
 * @see https://developer.work.weixin.qq.com/document/path/90057
 */
export const DeleteMenuRequestSchema = z.object({
  /** 应用id */
  agentid: z.number(),
});
export type DeleteMenuRequest = z.infer<typeof DeleteMenuRequestSchema>;

/**
 * 获取菜单
 * @see https://developer.work.weixin.qq.com/document/path/90056
 */
export const GetMenuRequestSchema = z.object({
  /** 应用id */
  agentid: z.number().min(1),
});
export type GetMenuRequest = z.infer<typeof GetMenuRequestSchema>;

