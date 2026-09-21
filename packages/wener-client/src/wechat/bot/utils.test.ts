import { describe, expect, it } from 'vitest';
import { WechatBotMessageItemType } from './types';
import { chunkWechatBotText, detectWechatBotMessageType, extractWechatBotText } from './utils';

describe('wechat/bot utils', () => {
	it('should extract text from mixed message items', () => {
		const text = extractWechatBotText([
			{ type: WechatBotMessageItemType.Text, text_item: { text: 'hello' } },
			{ type: WechatBotMessageItemType.Image },
			{
				type: WechatBotMessageItemType.File,
				file_item: {
					file_name: 'a.txt',
					media: { encrypt_query_param: 'x', aes_key: 'y' },
				},
			},
		]);

		expect(text).toContain('hello');
		expect(text).toContain('(image)');
		expect(text).toContain('(file: a.txt)');
	});

	it('should detect inbound message type from first item', () => {
		expect(detectWechatBotMessageType([{ type: WechatBotMessageItemType.Text }])).toBe('text');
		expect(detectWechatBotMessageType([{ type: WechatBotMessageItemType.Image }])).toBe('image');
		expect(detectWechatBotMessageType([])).toBe('unknown');
	});

	it('should chunk long text by limit', () => {
		const input = 'a'.repeat(1200) + '\n' + 'b'.repeat(1200) + '\n' + 'c'.repeat(1200);
		const chunks = chunkWechatBotText(input, 2000);
		expect(chunks.length).toBeGreaterThan(1);
		expect(chunks.every((v) => v.length <= 2000)).toBe(true);
	});
});
