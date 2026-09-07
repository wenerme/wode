import { expect, test } from 'vite-plus/test';
import { DEFAULT_WECOM_BOT_WS_URL, WecomBotClient } from './WecomBotClient';

test('should use default wsUrl when options.wsUrl is undefined', () => {
	const client = new WecomBotClient({
		botId: 'bot',
		secret: 'secret',
		wsUrl: undefined,
	});

	const options = (client as any).options as { wsUrl?: string };
	expect(options.wsUrl).toBe(DEFAULT_WECOM_BOT_WS_URL);
});

test('should use custom wsUrl when provided', () => {
	const client = new WecomBotClient({
		botId: 'bot',
		secret: 'secret',
		wsUrl: 'wss://example.com/ws',
	});

	const options = (client as any).options as { wsUrl?: string };
	expect(options.wsUrl).toBe('wss://example.com/ws');
});
