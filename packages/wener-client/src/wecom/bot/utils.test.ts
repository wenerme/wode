import { describe, expect, it } from 'vitest';
import {
	extractWecomBotMessageText,
	generateWecomReqId,
	isWecomBotCallbackPacket,
	isWecomBotResponsePacket,
	toWecomSendChatType,
} from './utils';

describe('wecom bot utils', () => {
	it('should generate req id', () => {
		const id = generateWecomReqId();
		expect(id.length).toBeGreaterThan(20);
		expect(id.includes('-')).toBe(false);
	});

	it('should detect callback packet', () => {
		expect(
			isWecomBotCallbackPacket({
				cmd: 'aibot_msg_callback',
				headers: { req_id: 'r1' },
				body: {},
			}),
		).toBe(true);
		expect(isWecomBotCallbackPacket({ cmd: 'ping' })).toBe(false);
	});

	it('should detect response packet', () => {
		expect(
			isWecomBotResponsePacket({
				headers: { req_id: 'r1' },
				errcode: 0,
				errmsg: 'ok',
			}),
		).toBe(true);
		expect(isWecomBotResponsePacket({ cmd: 'aibot_msg_callback' })).toBe(false);
	});

	it('should extract text message', () => {
		const text = extractWecomBotMessageText({
			msgid: 'm1',
			aibotid: 'b1',
			chattype: 'single',
			from: { userid: 'u1' },
			msgtype: 'text',
			text: { content: 'hello' },
		});
		expect(text).toBe('hello');
	});

	it('should extract mixed message', () => {
		const text = extractWecomBotMessageText({
			msgid: 'm1',
			aibotid: 'b1',
			chattype: 'group',
			from: { userid: 'u1' },
			msgtype: 'mixed',
			mixed: {
				msg_item: [
					{ msgtype: 'text', text: { content: '@bot hello' } },
					{ msgtype: 'image', image: { url: 'https://example.com/a.png' } },
				],
			},
		});
		expect(text).toBe('@bot hello\n(image)');
	});

	it('should map chat type for send', () => {
		expect(toWecomSendChatType('single')).toBe(1);
		expect(toWecomSendChatType('group')).toBe(2);
		expect(toWecomSendChatType(undefined)).toBe(0);
	});
});
