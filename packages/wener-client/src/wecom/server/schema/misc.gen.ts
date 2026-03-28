// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取唤起企业微信 code
 * @see https://developer.work.weixin.qq.com/document/path/94345
 */
export const GetLaunchCodeRequestSchema = z.object({
  /** 当前操作者的userid */
  operator_userid: z.string().min(1).max(64),
  /** 参数数据结构体，用于指定单聊对象 */
  single_chat: z.object({ userid: z.string().min(1).max(64) }),
});
export type GetLaunchCodeRequest = z.infer<typeof GetLaunchCodeRequestSchema>;
export const GetLaunchCodeResponseSchema = z.object({
  /** 唤起页面的code，5分钟内有效，只能消费一次。用于URI scheme客户端协议的launch_code参数 */
  launch_code: z.string().min(1).optional(),
});
export type GetLaunchCodeResponse = z.infer<typeof GetLaunchCodeResponseSchema>;

export const GetInvoiceTicketResponseSchema = z.object({
  /** 发票签名临时票据 */
  ticket: z.string().optional(),
  /** 有效期，以秒为单位。在有效期内重复请求，ticket不会被刷新 [timestamp] */
  expires_in: z.number().min(0).optional(),
});
export type GetInvoiceTicketResponse = z.infer<typeof GetInvoiceTicketResponseSchema>;

/**
 * 通过code获取用户信息
 * @see https://developer.work.weixin.qq.com/document/path/101021
 */
export const GetUserInfoByCodeRequestSchema = z.object({
  /** 通过成员授权获取到的code，每次成员授权带上的code将不一样，code只能使用一次，5分钟未被使用自动过期 */
  code: z.string(),
});
export type GetUserInfoByCodeRequest = z.infer<typeof GetUserInfoByCodeRequestSchema>;
export const GetUserInfoByCodeResponseSchema = z.object({
  /** 成员UserID */
  UserId: z.string().optional(),
});
export type GetUserInfoByCodeResponse = z.infer<typeof GetUserInfoByCodeResponseSchema>;

/**
 * 消息推送配置说明
 * @see https://developer.work.weixin.qq.com/document/path/101066
 */
export const SendWebhookMessageRequestSchema = z.object({
  /** 消息类型，固定为 text/markdown/markdown_v2/image/news/file/voice/template_card (text-文本, markdown-Markdown, markdown_v2-Markdown */
  msgtype: z.string(),
  /** 文本消息对象，当msgtype为text时必填 */
  text: z.object({ content: z.string(), mentioned_list: z.array(z.string()), mentioned_mobile_list: z.array(z.string()) }).optional(),
  /** Markdown消息对象，当msgtype为markdown时必填 */
  markdown: z.object({ content: z.string() }).optional(),
  /** Markdown V2消息对象，当msgtype为markdown_v2时必填 */
  markdown_v2: z.object({ content: z.string() }).optional(),
  /** 图片消息对象，当msgtype为image时必填 */
  image: z.object({ base64: z.string(), md5: z.string() }).optional(),
  /** 图文消息对象，当msgtype为news时必填 */
  news: z.object({ articles: z.array(z.record(z.string(), z.any())), undefined: z.object({ title: z.string(), description: z.string(), url: z.string(), picurl: z.string() }) }).optional(),
  /** 文件消息对象，当msgtype为file时必填 */
  file: z.object({ media_id: z.string() }).optional(),
  /** 语音消息对象，当msgtype为voice时必填 */
  voice: z.object({ media_id: z.string() }).optional(),
  /** 模版卡片对象，当msgtype为template_card时必填 */
  template_card: z.object({ card_type: z.string(), source: z.object({ icon_url: z.string(), desc: z.string(), desc_color: z.number() }), main_title: z.object({ title: z.string(), desc: z.string() }), emphasis_content: z.object({ title: z.string(), desc: z.string() }), quote_area: z.object({ type: z.number(), url: z.string(), appid: z.string(), pagepath: z.string(), title: z.string(), quote_text: z.string() }), sub_title_text: z.string(), horizontal_content_list: z.array(z.object({ keyname: z.string(), value: z.string(), type: z.number(), url: z.string(), media_id: z.string(), userid: z.string() })), jump_list: z.array(z.object({ type: z.number(), title: z.string(), url: z.string(), appid: z.string(), pagepath: z.string() })), card_action: z.object({ type: z.number(), url: z.string(), appid: z.string(), pagepath: z.string() }), card_image: z.object({ url: z.string(), aspect_ratio: z.number() }), image_text_area: z.object({ type: z.number(), url: z.string(), title: z.string(), desc: z.string(), image_url: z.string() }), vertical_content_list: z.array(z.object({ title: z.string(), desc: z.string() })) }).optional(),
});
export type SendWebhookMessageRequest = z.infer<typeof SendWebhookMessageRequestSchema>;

