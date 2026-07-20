import { randomBytes, randomUUID } from 'node:crypto';
import { WechatBotApiError } from './errors';
import {
	WechatBotMessageItemType,
	WechatBotMessageState,
	WechatBotMessageType,
	type WechatBotApiErrorBody,
	type WechatBotBaseInfo,
	type WechatBotGetConfigResponse,
	type WechatBotGetUpdatesResponse,
	type WechatBotMessageItem,
	type WechatBotQrCodeResponse,
	type WechatBotQrStatusResponse,
	type WechatBotSendMessagePayload,
	type WechatBotSendTypingPayload,
} from './types';

export const DEFAULT_WECHAT_BOT_BASE_URL = 'https://ilinkai.weixin.qq.com';
export const DEFAULT_WECHAT_BOT_CHANNEL_VERSION = '1.0.0';

export interface WechatBotRequestOptions {
	timeoutMs?: number;
	signal?: AbortSignal;
}

function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '');
}

function mergeSignal(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
	const timeoutSignal = AbortSignal.timeout(timeoutMs);
	if (!signal) {
		return timeoutSignal;
	}
	return AbortSignal.any([signal, timeoutSignal]);
}

function asJsonObject(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {};
	}
	return value as Record<string, unknown>;
}

function parseErrorBody(payload: Record<string, unknown>): WechatBotApiErrorBody {
	return {
		ret: typeof payload.ret === 'number' ? payload.ret : undefined,
		errcode: typeof payload.errcode === 'number' ? payload.errcode : undefined,
		errmsg: typeof payload.errmsg === 'string' ? payload.errmsg : undefined,
	};
}

async function parseJsonResponse(response: Response, endpoint: string): Promise<Record<string, unknown>> {
	const text = await response.text();
	const payload = text ? asJsonObject(JSON.parse(text) as unknown) : {};
	const body = parseErrorBody(payload);

	if (!response.ok) {
		throw new WechatBotApiError(body.errmsg ?? `${endpoint} failed with HTTP ${response.status}`, {
			endpoint,
			status: response.status,
			code: body.errcode,
			payload,
		});
	}

	if (typeof body.ret === 'number' && body.ret !== 0) {
		throw new WechatBotApiError(body.errmsg ?? `${endpoint} failed`, {
			endpoint,
			status: response.status,
			code: body.errcode ?? body.ret,
			payload,
		});
	}

	return payload;
}

function randomWechatUin(): string {
	const value = randomBytes(4).readUInt32BE(0);
	return Buffer.from(String(value), 'utf8').toString('base64');
}

export function buildWechatBotAuthHeaders(token: string): Headers {
	const headers = new Headers();
	headers.set('Content-Type', 'application/json');
	headers.set('AuthorizationType', 'ilink_bot_token');
	headers.set('Authorization', `Bearer ${token}`);
	headers.set('X-WECHAT-UIN', randomWechatUin());
	return headers;
}

export function createWechatBotBaseInfo(channelVersion = DEFAULT_WECHAT_BOT_CHANNEL_VERSION): WechatBotBaseInfo {
	return {
		channel_version: channelVersion,
	};
}

async function requestWechatBotPost<T>(
	baseUrl: string,
	endpoint: string,
	body: unknown,
	token: string,
	options: WechatBotRequestOptions = {},
): Promise<T> {
	const timeoutMs = options.timeoutMs ?? 40000;
	const response = await fetch(new URL(endpoint, `${normalizeBaseUrl(baseUrl)}/`), {
		method: 'POST',
		headers: buildWechatBotAuthHeaders(token),
		body: JSON.stringify(body),
		signal: mergeSignal(options.signal, timeoutMs),
	});
	const payload = await parseJsonResponse(response, endpoint);
	return payload as T;
}

async function requestWechatBotGet<T>(
	baseUrl: string,
	path: string,
	headers: Headers | Record<string, string> = {},
	options: WechatBotRequestOptions = {},
): Promise<T> {
	const timeoutMs = options.timeoutMs ?? 40000;
	const response = await fetch(new URL(path, `${normalizeBaseUrl(baseUrl)}/`), {
		method: 'GET',
		headers,
		signal: mergeSignal(options.signal, timeoutMs),
	});
	const payload = await parseJsonResponse(response, path);
	return payload as T;
}

export async function fetchWechatBotQrCode(
	baseUrl = DEFAULT_WECHAT_BOT_BASE_URL,
	options: WechatBotRequestOptions = {},
): Promise<WechatBotQrCodeResponse> {
	return requestWechatBotGet<WechatBotQrCodeResponse>(baseUrl, '/ilink/bot/get_bot_qrcode?bot_type=3', {}, options);
}

export async function pollWechatBotQrStatus(
	baseUrl: string,
	qrcode: string,
	options: WechatBotRequestOptions = {},
): Promise<WechatBotQrStatusResponse> {
	return requestWechatBotGet<WechatBotQrStatusResponse>(
		baseUrl,
		`/ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(qrcode)}`,
		{ 'iLink-App-ClientVersion': '1' },
		options,
	);
}

export async function getWechatBotUpdates(
	baseUrl: string,
	token: string,
	cursor: string,
	options: WechatBotRequestOptions = {},
): Promise<WechatBotGetUpdatesResponse> {
	return requestWechatBotPost<WechatBotGetUpdatesResponse>(
		baseUrl,
		'/ilink/bot/getupdates',
		{
			get_updates_buf: cursor,
			base_info: createWechatBotBaseInfo(),
		},
		token,
		{ timeoutMs: options.timeoutMs ?? 40000, signal: options.signal },
	);
}

export async function sendWechatBotMessage(
	baseUrl: string,
	token: string,
	payload: WechatBotSendMessagePayload['msg'],
	options: WechatBotRequestOptions = {},
): Promise<Record<string, unknown>> {
	return requestWechatBotPost<Record<string, unknown>>(
		baseUrl,
		'/ilink/bot/sendmessage',
		{
			msg: payload,
			base_info: createWechatBotBaseInfo(),
		},
		token,
		{ timeoutMs: options.timeoutMs ?? 15000, signal: options.signal },
	);
}

export async function getWechatBotConfig(
	baseUrl: string,
	token: string,
	userId: string,
	contextToken: string,
	options: WechatBotRequestOptions = {},
): Promise<WechatBotGetConfigResponse> {
	return requestWechatBotPost<WechatBotGetConfigResponse>(
		baseUrl,
		'/ilink/bot/getconfig',
		{
			ilink_user_id: userId,
			context_token: contextToken,
			base_info: createWechatBotBaseInfo(),
		},
		token,
		{ timeoutMs: options.timeoutMs ?? 15000, signal: options.signal },
	);
}

export async function sendWechatBotTyping(
	baseUrl: string,
	token: string,
	payload: WechatBotSendTypingPayload,
	options: WechatBotRequestOptions = {},
): Promise<Record<string, unknown>> {
	return requestWechatBotPost<Record<string, unknown>>(baseUrl, '/ilink/bot/sendtyping', payload, token, {
		timeoutMs: options.timeoutMs ?? 15000,
		signal: options.signal,
	});
}

export function buildWechatBotTextMessage(
	userId: string,
	contextToken: string,
	text: string,
): WechatBotSendMessagePayload['msg'] {
	const item: WechatBotMessageItem = {
		type: WechatBotMessageItemType.Text,
		text_item: { text },
	};
	return {
		from_user_id: '',
		to_user_id: userId,
		client_id: randomUUID(),
		message_type: WechatBotMessageType.Bot,
		message_state: WechatBotMessageState.Finish,
		context_token: contextToken,
		item_list: [item],
	};
}
