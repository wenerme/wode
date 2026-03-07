export interface WecomBotPacketHeaders {
	req_id?: string;
}

export interface WecomBotPacket<TBody = Record<string, unknown>> {
	cmd?: string;
	headers?: WecomBotPacketHeaders;
	body?: TBody;
	errcode?: number;
	errmsg?: string;
}

export interface WecomBotFrom {
	userid: string;
	corpid?: string;
}

export interface WecomBotTextContent {
	content: string;
}

export interface WecomBotMediaContent {
	url: string;
	aeskey?: string;
}

export interface WecomBotVoiceContent {
	content: string;
}

export interface WecomBotMixedItem {
	msgtype: string;
	text?: WecomBotTextContent;
	image?: WecomBotMediaContent;
	file?: WecomBotMediaContent;
	video?: WecomBotMediaContent;
	voice?: WecomBotVoiceContent;
}

export interface WecomBotQuoteItem extends WecomBotMixedItem {}

export interface WecomBotMessageCallbackBody {
	msgid: string;
	aibotid: string;
	chatid?: string;
	chattype: 'single' | 'group';
	from: WecomBotFrom;
	msgtype: 'text' | 'image' | 'mixed' | 'voice' | 'file' | 'video' | string;
	text?: WecomBotTextContent;
	image?: WecomBotMediaContent;
	file?: WecomBotMediaContent;
	video?: WecomBotMediaContent;
	voice?: WecomBotVoiceContent;
	mixed?: { msg_item?: WecomBotMixedItem[] };
	quote?: WecomBotQuoteItem;
	response_url?: string;
}

export interface WecomBotEventBody {
	eventtype: string;
	[key: string]: unknown;
}

export interface WecomBotEventCallbackBody {
	msgid: string;
	create_time?: number;
	aibotid: string;
	chatid?: string;
	chattype?: 'single' | 'group';
	from?: WecomBotFrom;
	msgtype: 'event';
	event: WecomBotEventBody;
	response_url?: string;
}

export interface WecomBotMessageCallbackPacket extends WecomBotPacket<WecomBotMessageCallbackBody> {
	cmd: 'aibot_msg_callback';
	headers: WecomBotPacketHeaders & { req_id: string };
	body: WecomBotMessageCallbackBody;
}

export interface WecomBotEventCallbackPacket extends WecomBotPacket<WecomBotEventCallbackBody> {
	cmd: 'aibot_event_callback';
	headers: WecomBotPacketHeaders & { req_id: string };
	body: WecomBotEventCallbackBody;
}

export type WecomBotIncomingCallbackPacket = WecomBotMessageCallbackPacket | WecomBotEventCallbackPacket;

export interface WecomBotResponsePacket<TBody = Record<string, unknown>>
	extends WecomBotPacket<TBody> {
	headers: WecomBotPacketHeaders & { req_id: string };
	errcode: number;
	errmsg: string;
}

export type WecomBotOutgoingMessageBody =
	| { msgtype: 'text'; text: { content: string } }
	| { msgtype: 'stream'; stream: { id: string; finish: boolean; content: string } }
	| { msgtype: 'markdown'; markdown: { content: string; feedback?: { id: string } } }
	| { msgtype: 'template_card'; template_card: Record<string, unknown> }
	| { msgtype: 'file'; file: { media_id: string } }
	| { msgtype: 'image'; image: { media_id: string } }
	| { msgtype: 'voice'; voice: { media_id: string } }
	| { msgtype: 'video'; video: { media_id: string; title?: string; description?: string } };

export interface WecomBotSendMessageBody extends WecomBotOutgoingMessageBody {
	chatid: string;
	chat_type?: 0 | 1 | 2;
}

export type WecomBotCommandRequest =
	| {
			cmd: 'aibot_subscribe';
			body: {
				bot_id: string;
				secret: string;
			};
	  }
	| {
			cmd: 'ping';
	  }
	| {
			cmd: 'aibot_respond_welcome_msg';
			body: WecomBotOutgoingMessageBody;
	  }
	| {
			cmd: 'aibot_respond_msg';
			body: WecomBotOutgoingMessageBody;
	  }
	| {
			cmd: 'aibot_respond_update_msg';
			body: Record<string, unknown>;
	  }
	| {
			cmd: 'aibot_send_msg';
			body: WecomBotSendMessageBody;
	  };

