import { describe, expect, it, vi } from 'vitest';
import { createOpenObserveServiceToolClient } from './client';
import { sanitizeOpenObserveOutput } from './sanitize';

function runtime() {
	return {
		getSchema: vi.fn(async () => ({ tools: Object.fromEntries(['health', 'updateStreamSettings', 'deleteStream', 'ingestJson', 'ingestMulti'].map((name) => [name, { inputSchema: {} }])) })),
		call: vi.fn(async (input: { body: { toolName: string } }) => input.body.toolName === 'deleteStream' ? { code: 200 } : { status: 'ok' }),
	};
}
describe('OpenObserve tool client boundaries', () => {
	it.each([undefined, true])('blocks every write when readOnly is %s', async (readOnly) => {
		const port = runtime();
		const client = await createOpenObserveServiceToolClient(port, 'observe', { readOnly });
		try {
			await expect(client.updateStreamSettings({ stream: 'app', settings: { data_retention: 7 } })).rejects.toThrow('read-only');
			await expect(client.deleteStream({ stream: 'app' })).rejects.toThrow('read-only');
			await expect(client.ingestJson({ stream: 'app', records: [{}] })).rejects.toThrow('read-only');
			await expect(client.ingestMulti({ stream: 'app', records: [{}] })).rejects.toThrow('read-only');
			expect(port.call).not.toHaveBeenCalled();
		} finally { await client.close(); }
	});
	it('allows explicit writable policy and stops calls after close', async () => {
		const port = runtime();
		const client = await createOpenObserveServiceToolClient(port, 'observe', { readOnly: false });
		await client.deleteStream({ stream: 'app' });
		expect(port.call).toHaveBeenCalledOnce();
		await client.close();
		await expect(client.health()).rejects.toThrow('closed');
	});
	it('times out even when the runtime ignores AbortSignal', async () => {
		const port = runtime();
		port.call.mockImplementation(() => new Promise(() => {}));
		const client = await createOpenObserveServiceToolClient(port, 'observe');
		try { await expect(client.health({}, { context: { timeoutMs: 5 } })).rejects.toThrow('timed out'); }
		finally { await client.close(); }
	});
	it('validates timeout before dispatch', async () => {
		const port = runtime();
		const client = await createOpenObserveServiceToolClient(port, 'observe');
		try {
			await expect(client.health({}, { context: { timeoutMs: 0 } })).rejects.toThrow('timeout');
			expect(port.call).not.toHaveBeenCalled();
		} finally { await client.close(); }
	});
	it('validates the remote output envelope before returning it', async () => {
		const port = runtime();
		port.call.mockImplementation(async () => ({ status: 'unexpected' }));
		const client = await createOpenObserveServiceToolClient(port, 'observe');
		try { await expect(client.health({})).rejects.toThrow('Invalid OpenObserve response'); }
		finally { await client.close(); }
	});
	it('propagates per-call abort and closes an in-flight request', async () => {
		const port = runtime();
		port.call.mockImplementation(() => new Promise(() => {}));
		const client = await createOpenObserveServiceToolClient(port, 'observe');
		const controller = new AbortController();
		const request = client.health({}, { signal: controller.signal });
		controller.abort(new Error('fixture aborted'));
		await expect(request).rejects.toThrow('fixture aborted');
		const second = client.health({});
		await client.close();
		await expect(second).rejects.toThrow('closed');
	});
	it('cleans up after a synchronous transport throw before close or async dispose', async () => {
		const port = runtime();
		port.call.mockImplementation(() => { throw new Error('fixture transport throw'); });
		const client = await createOpenObserveServiceToolClient(port, 'observe');
		const completes = async (promise: PromiseLike<void>) => {
			let timer: ReturnType<typeof setTimeout> | undefined;
			try {
				return await Promise.race([
					promise,
					new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('cleanup timed out')), 100); }),
				]);
			} finally {
				if (timer !== undefined) clearTimeout(timer);
			}
		};
		await expect(client.health({})).rejects.toThrow('fixture transport throw');
		await expect(completes(client.close())).resolves.toBeUndefined();
		await expect(completes(client[Symbol.asyncDispose]())).resolves.toBeUndefined();
	});
	it('redacts structured JSON strings and quoted keys inside text', () => {
		const source = { message: '{"password":"FIXTURE_VALUE","nested":{"api_key":"FIXTURE_KEY"}}', text: 'payload={"token":"FIXTURE_TOKEN"}' };
		const result = sanitizeOpenObserveOutput(source);
		expect(JSON.parse(result.message)).toEqual({ password: '<redacted>', nested: { api_key: '<redacted>' } });
		expect(result.text).toBe('payload={"token":"<redacted>"}');
		expect(source.message).toContain('FIXTURE_VALUE');
	});
});
