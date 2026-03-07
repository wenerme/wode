import { createRelayMcpServer } from '@wener/ai/mcp/relay';
import { describe, expect, it } from 'vitest';

describe('createRelayMcpServer', () => {
	describe('deepwiki relay', () => {
		it('should connect to deepwiki and list tools', async () => {
			const { getClient, close } = createRelayMcpServer({
				url: 'https://mcp.deepwiki.com/mcp',
				transport: 'http',
				name: 'deepwiki-relay',
			});

			try {
				const client = await getClient();
				expect(client).toBeDefined();

				const tools = await client.listTools();
				expect(tools.tools).toBeDefined();
				expect(Array.isArray(tools.tools)).toBe(true);
				console.log(
					'DeepWiki tools:',
					tools.tools.map((t: { name: string }) => t.name),
				);
			} finally {
				await close();
			}
		}, 30000);
	});

	describe('huggingface relay', () => {
		it.skip('should connect to huggingface (requires login)', async () => {
			// Note: huggingface requires login, so this test is skipped by default
			const { getClient, close } = createRelayMcpServer({
				url: 'https://huggingface.co/mcp',
				transport: 'http',
				name: 'hf-relay',
			});

			try {
				const client = await getClient();
				expect(client).toBeDefined();
			} finally {
				await close();
			}
		}, 30000);
	});
});
