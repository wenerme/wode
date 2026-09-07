import { describe, expect, it } from 'vite-plus/test';
import { JinaReaderClient } from './index';

describe('JinaReaderClient', () => {
	it('reads web content through r.jina.ai as JSON', async () => {
		const calls: Array<{ url: string; init: RequestInit }> = [];
		const client = new JinaReaderClient({
			baseUrl: 'https://reader.example.test',
			fetch: async (input, init = {}) => {
				calls.push({ url: String(input), init });
				return new Response(
					JSON.stringify({ data: { title: 'Example', url: 'https://example.test', content: '# Example' } }),
					{
						status: 200,
						headers: { 'content-type': 'application/json' },
					},
				);
			},
		});

		const response = await client.read('https://example.test');

		expect(response.data?.content).toBe('# Example');
		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe('https://reader.example.test/http://https://example.test');
		expect(new Headers(calls[0]?.init.headers).get('accept')).toBe('application/json');
	});
});
