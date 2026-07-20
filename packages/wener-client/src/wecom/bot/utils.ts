import { randomUUID } from 'node:crypto';
import type {
	WecomBotIncomingCallbackPacket,
	WecomBotMessageCallbackBody,
	WecomBotPacket,
	WecomBotResponsePacket,
} from './types';

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
	return value as Record<string, unknown>;
}

function getString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value : undefined;
}

export function generateWecomReqId(): string {
	return randomUUID().replaceAll('-', '');
}

export function isWecomBotCallbackPacket(packet: unknown): packet is WecomBotIncomingCallbackPacket {
	const cmd = getString(asRecord(packet).cmd);
	return cmd === 'aibot_msg_callback' || cmd === 'aibot_event_callback';
}

export function isWecomBotResponsePacket(packet: unknown): packet is WecomBotResponsePacket {
	const obj = asRecord(packet);
	const headers = asRecord(obj.headers);
	return (
		typeof obj.errcode === 'number' &&
		typeof obj.errmsg === 'string' &&
		typeof headers.req_id === 'string' &&
		headers.req_id.length > 0
	);
}

function extractMixedItemText(item: Record<string, unknown>): string {
	const msgtype = getString(item.msgtype) ?? 'unknown';
	if (msgtype === 'text') {
		const text = getString(asRecord(item.text).content);
		return text ?? '';
	}
	if (msgtype === 'voice') {
		const voice = getString(asRecord(item.voice).content);
		return voice ? `(voice) ${voice}` : '(voice)';
	}
	if (msgtype === 'image') {
		return '(image)';
	}
	if (msgtype === 'file') {
		return '(file)';
	}
	if (msgtype === 'video') {
		return '(video)';
	}
	return `(${msgtype})`;
}

export function extractWecomBotMessageText(body: WecomBotMessageCallbackBody): string {
	switch (body.msgtype) {
		case 'text':
			return body.text?.content ?? '';
		case 'voice':
			return body.voice?.content ? `(voice) ${body.voice.content}` : '(voice)';
		case 'image':
			return '(image)';
		case 'file':
			return '(file)';
		case 'video':
			return '(video)';
		case 'mixed': {
			const items = body.mixed?.msg_item ?? [];
			const lines = items
				.map((item) => extractMixedItemText(item as unknown as Record<string, unknown>))
				.filter(Boolean);
			return lines.join('\n');
		}
		default:
			return '';
	}
}

export function normalizeWecomChatType(chatType: unknown): 'single' | 'group' {
	return chatType === 'group' ? 'group' : 'single';
}

export function toWecomSendChatType(chatType: 'single' | 'group' | 0 | 1 | 2 | undefined): 0 | 1 | 2 {
	if (chatType === 'single' || chatType === 1) return 1;
	if (chatType === 'group' || chatType === 2) return 2;
	return 0;
}

export function parseWecomPacket(rawText: string): WecomBotPacket {
	return JSON.parse(rawText) as WecomBotPacket;
}
