import { WechatWebhookQuery } from '../../wechat/webhook';

export interface WecomWebhookEncryptPayload {
  ToUserName: string;
  Encrypt: string;
  AgentID: number;
}

export interface WecomWebhookPayload {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: string;
  MsgId: string;
  AgentID: number;
}

export type WecomWebhookQuery = WechatWebhookQuery;
