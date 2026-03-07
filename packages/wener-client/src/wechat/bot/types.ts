export const WechatBotMessageType = Object.freeze({
	User: 1,
	Bot: 2,
} as const);

export const WechatBotMessageState = Object.freeze({
	New: 0,
	Generating: 1,
	Finish: 2,
} as const);

export const WechatBotMessageItemType = Object.freeze({
	Text: 1,
	Image: 2,
	Voice: 3,
	File: 4,
	Video: 5,
} as const);

export type WechatBotMessageTypeValue =
	(typeof WechatBotMessageType)[keyof typeof WechatBotMessageType];
export type WechatBotMessageStateValue =
	(typeof WechatBotMessageState)[keyof typeof WechatBotMessageState];
export type WechatBotMessageItemTypeValue =
	(typeof WechatBotMessageItemType)[keyof typeof WechatBotMessageItemType];

export interface WechatBotBaseInfo {
	channel_version: string;
}

export interface WechatBotCredentials {
	token: string;
	baseUrl: string;
	accountId: string;
	userId: string;
	savedAt?: string;
}

export interface WechatBotQrCodeResponse {
	qrcode: string;
	qrcode_img_content: string;
}

export interface WechatBotQrStatusResponse {
	status: 'wait' | 'scaned' | 'confirmed' | 'expired';
	bot_token?: string;
	ilink_bot_id?: string;
	ilink_user_id?: string;
	baseurl?: string;
}

export interface WechatBotApiErrorBody {
	errcode?: number;
	errmsg?: string;
	ret?: number;
}

export interface WechatBotCdnMedia {
	encrypt_query_param: string;
	aes_key: string;
	encrypt_type?: 0 | 1;
}

export interface WechatBotTextItem {
	text: string;
}

export interface WechatBotImageItem {
	media: WechatBotCdnMedia;
}

export interface WechatBotVoiceItem {
	media: WechatBotCdnMedia;
	text?: string;
}

export interface WechatBotFileItem {
	media: WechatBotCdnMedia;
	file_name?: string;
}

export interface WechatBotVideoItem {
	media: WechatBotCdnMedia;
}

export interface WechatBotMessageItem {
	type: WechatBotMessageItemTypeValue;
	text_item?: WechatBotTextItem;
	image_item?: WechatBotImageItem;
	voice_item?: WechatBotVoiceItem;
	file_item?: WechatBotFileItem;
	video_item?: WechatBotVideoItem;
}

export interface WechatBotMessage {
	message_id: number;
	from_user_id: string;
	to_user_id: string;
	client_id: string;
	create_time_ms: number;
	message_type: WechatBotMessageTypeValue;
	message_state: WechatBotMessageStateValue;
	context_token: string;
	item_list: WechatBotMessageItem[];
}

export interface WechatBotGetUpdatesResponse extends WechatBotApiErrorBody {
	msgs: WechatBotMessage[];
	get_updates_buf: string;
	longpolling_timeout_ms?: number;
}

export interface WechatBotSendMessagePayload {
	msg: {
		from_user_id: string;
		to_user_id: string;
		client_id: string;
		message_type: WechatBotMessageTypeValue;
		message_state: WechatBotMessageStateValue;
		context_token: string;
		item_list: WechatBotMessageItem[];
	};
	base_info: WechatBotBaseInfo;
}

export interface WechatBotGetConfigResponse extends WechatBotApiErrorBody {
	typing_ticket?: string;
}

export interface WechatBotSendTypingPayload {
	ilink_user_id: string;
	typing_ticket: string;
	status: 1 | 2;
	base_info: WechatBotBaseInfo;
}

export interface WechatBotIncomingMessage {
	id: string;
	messageId: number;
	userId: string;
	text: string;
	type: 'text' | 'image' | 'voice' | 'file' | 'video' | 'unknown';
	contextToken: string;
	timestamp: Date;
	raw: WechatBotMessage;
}
