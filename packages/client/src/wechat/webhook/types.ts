export interface WechatWebhookEncryptPayload {
  ToUserName: string;
  Encrypt: string;
}

export interface WechatWebhookPayload {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: string;
  Event: string;
  EventKey: string;
}

export type WechatWebhookQuery =
  | {
      signature: string;
      timestamp: string;
      nonce: string;
      echostr?: string;
    }
  | {
      signature: string;
      timestamp: string;
      nonce: string;
      openid: string;
      encrypt_type: string;
      msg_signature: string;
      echostr?: string;
    };
