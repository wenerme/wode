// Code generated from WeChat API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 发送聊天工具消息
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/chatToolOpenMode.html
 */
export const SendChatToolMsgRequestSchema = z.object({
  /** 动态消息的 activityId，通过创建接口获取 */
  activity_id: z.string(),
  /** 活动状态，初始值为1（表示开始收集态），可设置为2（即将截止态）、3（已结束态） (1-开始收集态, 2-即将截止态, 3-已结束态) */
  target_state: z.number(),
  /** 更新后的聊天室成员状态，当target_state=1时必填，target_state=2或3时无需填写 */
  participator_info_list: z.array(z.object({ group_openid: z.string(), state: z.number() })).optional(),
  /** 系统消息文字链打开的小程序版本，0 正式版，1 开发版，2 体验版 (0-正式版, 1-开发版, 2-体验版) */
  version_type: z.number(),
});
export type SendChatToolMsgRequest = z.infer<typeof SendChatToolMsgRequestSchema>;

/**
 * 生物认证接口
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/bio-auth.html
 */
export const VerifySoterSignatureRequestSchema = z.object({
  /** 用户的OpenID */
  openid: z.string(),
  /** 小程序端调用wx.startSoterAuthentication返回的resultJSON字段 */
  json_string: z.string(),
  /** 小程序端调用wx.startSoterAuthentication返回的resultJSONSignature字段 */
  json_signature: z.string(),
});
export type VerifySoterSignatureRequest = z.infer<typeof VerifySoterSignatureRequestSchema>;
export const VerifySoterSignatureResponseSchema = z.object({
  /** 验证结果，true表示成功，false表示失败 */
  is_ok: z.boolean().optional(),
});
export type VerifySoterSignatureResponse = z.infer<typeof VerifySoterSignatureResponseSchema>;

/**
 * 查询校园场景支付刷脸模式联系人列表
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/device/voip-plugin/wxpay.html
 */
export const GetVoipContactListRequestSchema = z.object({
  /** 学生 userId（微信支付刷脸返回的 user_id） */
  user_id: z.string(),
});
export type GetVoipContactListRequest = z.infer<typeof GetVoipContactListRequestSchema>;
export const GetVoipContactListResponseSchema = z.object({
  /** 联系人列表 */
  contact_list: z.array(z.object({ open_id: z.string(), role: z.number() })).optional(),
});
export type GetVoipContactListResponse = z.infer<typeof GetVoipContactListResponseSchema>;
