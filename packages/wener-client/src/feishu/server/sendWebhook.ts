import { hmac, type FetchLike } from '@wener/utils';

export type FeishuWebhookMessagePayload = MessageTypeContent & {
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

export async function sendWebhook({
	url,
	secret,
	markdown,
	text,
	payload,
	fetch = globalThis.fetch,
}: {
	url: string;
	secret?: string;
	// syntax https://open.feishu.cn/document/common-capabilities/message-card/message-cards-content/using-markdown-tags
	markdown?: string;
	text?: string;
	fetch?: FetchLike;
	payload?: FeishuWebhookMessagePayload;
}) {
	if (!payload) {
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
		} else if (text) {
			payload = {
				msg_type: 'text',
				content: {
					text,
				},
			};
		}
	}
	if (!payload) {
		throw new Error('No payload');
	}

	let data: FeishuWebhookMessagePayload = payload;
	if (secret) {
		const timestamp = `${Math.floor(Date.now() / 1000)}`;
		const sign = await createSign(secret, timestamp);
		data = {
			timestamp,
			sign,
			...data,
		};
	}
	let res = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(data),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	let out: BotHookResponse;
	try {
		out = await res.json();
	} catch (e) {
		throw e;
	}
	if (out.code !== 0) {
		throw Object.assign(new Error(`FeishuWebhook(${out.code}) ${out.msg}`), { payload: out });
	}
	return out;
}

export async function createSign(secret: string, timestamp: number | string) {
	// https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN#348211be
	const stringToSign = `${timestamp}\n${secret}`;
	return await hmac('sha256', stringToSign, '', 'base64');
	// const hmac = createHmac('sha256', stringToSign);
	// hmac.update('');
	// return hmac.digest('base64');
}
