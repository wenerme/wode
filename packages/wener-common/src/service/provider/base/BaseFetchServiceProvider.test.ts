import { describe, expect, it, vi } from 'vitest';
import type { CliServiceConfig } from '../../config';
import { BaseFetchServiceProvider, createBaseFetchService } from './BaseFetchServiceProvider';

const config = (value: Partial<CliServiceConfig> = {}): CliServiceConfig => ({
	provider: 'fetch',
	readOnly: true,
	...value,
});

describe('base fetch service', () => {
	it('fetches the real URL with headers and preserves the response content type', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
			expect(String(input)).toBe('https://example.test/page');
			expect(new Headers(init?.headers).get('x-test')).toBe('fixture');
			return new Response('<h1>Example</h1>', {
				status: 200,
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		});
		const service = createBaseFetchService({ fetch, headers: { 'x-test': 'fixture' } });

		await expect(service.fetch({ url: 'https://example.test/page' })).resolves.toEqual({
			url: 'https://example.test/page',
			content: '# Example',
			contentType: 'text/html; charset=utf-8',
		});
	});

	it('truncates content after reading the raw response and validates request parameters', async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('0123456789'));
		const service = createBaseFetchService({ fetch });
		await expect(service.fetch({ url: 'https://example.test', maxCharacters: 4 })).resolves.toMatchObject({
			content: '0123',
		});
		for (const input of [
			{ url: 'ftp://example.test' },
			{ url: 'https://user:secret@example.test' },
			{ url: 'https://example.test', maxCharacters: 0 },
			{ url: 'https://example.test', maxCharacters: 1.5 },
			{ url: 'https://example.test', maxCharacters: Number.MAX_SAFE_INTEGER + 1 },
			{ url: 'https://example.test', unknown: true },
		]) {
			await expect(service.fetch(input as never)).rejects.toThrow();
		}
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('checks caller cancellation before and after the Web Fetch call', async () => {
		const controller = new AbortController();
		const reason = new Error('caller cancellation');
		const fetch = vi.fn<typeof globalThis.fetch>(async () => {
			controller.abort(reason);
			return new Response('late');
		});
		const service = createBaseFetchService({ fetch });
		await expect(service.fetch({ url: 'https://example.test' }, { signal: controller.signal })).rejects.toBe(reason);
		controller.abort(reason);
		await expect(service.fetch({ url: 'https://example.test' }, { signal: controller.signal })).rejects.toBe(reason);
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('redacts non-ok, transport, and body errors', async () => {
		for (const fetch of [
			vi.fn<typeof globalThis.fetch>(
				async () => new Response('PRIVATE_BODY', { status: 403, statusText: 'PRIVATE_STATUS' }),
			),
			vi.fn<typeof globalThis.fetch>(async () => {
				throw new Error('PRIVATE_URL PRIVATE_HEADER');
			}),
			vi.fn<typeof globalThis.fetch>(async () => {
				const response = new Response('PRIVATE_BODY');
				vi.spyOn(response, 'text').mockRejectedValue(new Error('PRIVATE_BODY'));
				return response;
			}),
		]) {
			const error = await createBaseFetchService({ fetch })
				.fetch({ url: 'https://example.test/PRIVATE_URL' })
				.catch((error) => error);
			expect(error).toBeInstanceOf(Error);
			expect(String(error)).toMatch(/Fetch request failed/);
			expect(JSON.stringify(error)).not.toContain('PRIVATE');
		}
	});
});
