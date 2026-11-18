import { describe, expect, it, vi } from 'vitest';
import type { CliServiceConfig } from '../../config';
import { BaseFetchServiceProvider, createBaseFetchService } from '../base/BaseFetchServiceProvider';
import { createJinaFetchService, JinaFetchServiceProvider } from './JinaFetchServiceProvider';

const config = (value: Partial<CliServiceConfig> = {}): CliServiceConfig => ({
	provider: 'fetch',
	readOnly: true,
	...value,
});

describe('Jina fetch service', () => {
	it('uses Jina Reader with the configured URL, headers, API key, and timeout', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
			expect(String(input)).toBe('https://reader.example.test/https://example.test/page');
			expect(new Headers(init?.headers).get('x-test')).toBe('fixture');
			expect(new Headers(init?.headers).get('authorization')).toBe('Bearer PRIVATE_KEY');
			expect(init?.signal).toBeDefined();
			return Response.json({
				data: {
					title: 'Example',
					url: 'https://example.test/page',
					content: '# Example',
					metadata: { source: 'fixture' },
				},
			});
		});
		const service = createJinaFetchService({
			fetch,
			baseUrl: 'https://reader.example.test',
			headers: { 'x-test': 'fixture' },
			apiKey: 'PRIVATE_KEY',
			timeout: 1000,
		});
		await expect(service.fetch({ url: 'https://example.test/page', maxCharacters: 4 })).resolves.toEqual({
			url: 'https://example.test/page',
			content: '# Ex',
			title: 'Example',
			metadata: { source: 'fixture' },
		});
	});

	it('keeps cancellation reliable through the Jina client', async () => {
		const controller = new AbortController();
		const reason = new Error('caller cancellation');
		const fetch = vi.fn<typeof globalThis.fetch>(async (_input, init) => {
			return await new Promise<Response>((_, reject) => {
				expect(init?.signal?.aborted).toBe(false);
				init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), {
					once: true,
				});
				controller.abort(reason);
			});
		});
		const service = createJinaFetchService({ fetch });
		await expect(service.fetch({ url: 'https://example.test' }, { signal: controller.signal })).rejects.toBe(reason);
	});

	it('rejects unsupported service options and invalid provider configuration offline', () => {
		expect(() => createBaseFetchService({ timeout: 1 } as never)).toThrow('Invalid base fetch service configuration');
		expect(() => createJinaFetchService({ unknown: true } as never)).toThrow(
			'Invalid Jina fetch service configuration',
		);
		expect(() =>
			BaseFetchServiceProvider.create({
				name: 'fetch',
				config: config({ options: { unknown: 'PRIVATE' } }),
				context: { services: {} },
				fetch: vi.fn(),
			}),
		).toThrow('Invalid base fetch service configuration');
		expect(() =>
			JinaFetchServiceProvider.create({
				name: 'fetch',
				config: config({ baseUrl: 'ftp://private.test' }),
				context: { services: {} },
				fetch: vi.fn(),
			}),
		).toThrow('Invalid Jina fetch service configuration');
	});
});
