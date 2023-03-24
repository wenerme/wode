import { type AxiosRequestConfig } from 'axios';
import { createHmac } from 'node:crypto';
import { z } from 'zod';

export type FeishuBotMessagePayload = MessageTypeContent & {
  timestamp?: string;
  sign?: string;
};

type MessageTypeContent =
  | {
      msg_type: 'text';
      content: {
        text: string;
      };
    }
  | {
      msg_type: 'image';
      content: {
        image_key: string;
      };
    }
  | {
      msg_type: 'interactive';
      card: {
        elements: MessageTag[];
        header?: {
          title: {
            content: string;
            tag: 'plain_text';
          };
        };
      };
    }
  | {
      msg_type: 'share_chat'; // 发送群名片
      content: {
        share_chat_id: string;
      };
    }
  | {
      msg_type: 'post';
      content: {
        post: {
          zh_cn: {
            title?: string;
            content: Array<Array<MessageTag>>;
          };
        };
      };
    };

type MessageTag =
  | {
      tag: 'text';
      text: string;
    }
  | {
      tag: 'a';
      text: string;
      href: string;
    }
  | {
      tag: 'at';
      // open_id
      user_id: string;
    }
  | {
      tag: 'div';
      text: TextLikeContent;
    }
  | {
      tag: 'button';
      text: TextLikeContent;
      url: string;
      type: string;
      value: Record<string, any>;
    }
  | {
      tag: 'action';
      actions: Array<MessageTag>;
    };

type TextLikeContent =
  | string
  | {
      content: string;
      tag: 'lark_md' | 'plain_text';
    };

export interface BotHookResponse {
  StatusCode: number;
  StatusMessage: string;
  code: number; // 0
  msg: string; // success
  data: Record<string, any>;
}

export const FeishuBotConfig = z.object({
  url: z.string(),
  secret: z.string().min(1).optional(),
});
export type FeishuBotHookConfig = z.infer<typeof FeishuBotConfig>;

export function createFeishuBotHookRequest({
  config,
  text,
  markdown,
}: {
  config: FeishuBotHookConfig;
  text?: string;
  markdown?: string;
}): AxiosRequestConfig {
  const { url, secret } = config;

  let payload = {
    msg_type: 'text',
    content: {
      text,
    },
  } as FeishuBotMessagePayload;
  if (markdown) {
    payload = {
      msg_type: 'interactive',
      card: {
        elements: [
          {
            tag: 'div',
            text: {
              content: markdown,
              tag: 'lark_md',
            },
          },
        ],
      },
    };
  }
  if (secret) {
    const timestamp = `${Math.floor(Date.now() / 1000)}`;
    const sign = createSign(secret, timestamp);
    payload = {
      timestamp,
      sign,
      ...payload,
    };
  }
  return {
    method: 'POST',
    url,
    data: payload,
  };
}

export function createSign(secret: string, timestamp: number | string): string {
  // https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN#348211be
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = createHmac('sha256', stringToSign);
  hmac.update('');
  return hmac.digest('base64');
}
