import { createRedactor, setRedactor } from '@wener/common/redact';
import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createCli } from './createCli';

function fixture(readOnly = true) {
	const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json([{ appId: 'sample' }]));
	const readText = vi.fn(async () => '{"title":"release"}');
	const getEnv = vi.fn(() => 'fixture-token');
	const cli = createCli({
		config: createMemoryCliConfigStore({
			services: [
				{
					name: 'settings',
					type: 'apollo',
					readOnly,
					options: {
						appId: 'sample',
						config: { baseUrl: 'https://config.example.test' },
						admin: { baseUrl: 'https://admin.example.test', auth: { type: 'token', token: 'env://APOLLO_TOKEN' } },
						portal: { baseUrl: 'https://portal.example.test' },
					},
				},
			],
		}),
		fetch,
		readText,
		getEnv,
	});
	const lines: string[] = [];
	return {
		cli,
		fetch,
		getEnv,
		readText,
		lines,
		io: { signal: new AbortController().signal, stdout: (text: string) => lines.push(text) },
	};
}

describe('Apollo CLI and runtime integration', () => {
	it('discovers all operations without resolving credentials and dispatches admin reads', async () => {
		const f = fixture();
		await f.cli.executeLine('svc schema settings --json', f.io);
		const schema = JSON.parse(f.lines.pop()!);
		expect(schema.tools.publishNamespaceRelease.annotations.readOnlyHint).toBe(false);
		expect(schema.tools.listApp.annotations.readOnlyHint).toBe(true);
		expect(f.getEnv).not.toHaveBeenCalled();
		expect(f.fetch).not.toHaveBeenCalled();
		await f.cli.executeLine('apollo admin list-app --json', f.io);
		expect(JSON.parse(f.lines.pop()!)).toEqual([{ appId: 'sample' }]);
		expect(String(f.fetch.mock.calls[0]?.[0])).toContain('/openapi/v1/apps');
	});

	it('requires writable configuration and confirmation before reading mutation input', async () => {
		const f = fixture();
		await expect(f.cli.executeLine('apollo release publish --input @release.json --yes', f.io)).rejects.toThrow(
			'read-only',
		);
		expect(f.readText).not.toHaveBeenCalled();
		expect(f.getEnv).not.toHaveBeenCalled();
		const writable = fixture(false);
		await expect(writable.cli.executeLine('apollo release publish --input @release.json', writable.io)).rejects.toThrow(
			'--yes',
		);
		expect(writable.readText).not.toHaveBeenCalled();
		expect(writable.getEnv).not.toHaveBeenCalled();
		expect(writable.fetch).not.toHaveBeenCalled();
	});

	it('returns usable config values from both service calls and CLI; redaction is an explicit display option', async () => {
		const f = fixture();
		const values = {
			password: 'fixture-password',
			token: 'fixture-business-token',
			replica: 'app:fixture-password@tcp(db.example.test:3306)/sample',
		};
		f.fetch.mockImplementation(async () => Response.json(values));
		await f.cli.executeLine('service call settings readConfig --input \'{"format":"json"}\' --json', f.io);
		expect(JSON.parse(f.lines.pop()!)).toEqual(values);
		await f.cli.executeLine('apollo read --read-format json --json', f.io);
		expect(JSON.parse(f.lines.pop()!)).toEqual(values);
		await f.cli.executeLine('apollo --redact read --read-format json --json', f.io);
		expect(JSON.parse(f.lines.pop()!)).toMatchObject({ password: '<redacted>', token: '<redacted>' });
		await f.cli.executeLine('apollo read --read-format json --json', f.io);
		expect(JSON.parse(f.lines.pop()!)).toEqual(values);
	});

	it('keeps HTTP diagnostics redacted even though successful config output defaults to original data', async () => {
		const f = fixture();
		f.fetch.mockImplementation(async () =>
			Response.json(
				{
					message: 'invalid password=fixture-error-secret',
					error: 'fixture-private-body',
				},
				{ status: 400 },
			),
		);
		const error = await f.cli.executeLine('apollo admin list-app --json', f.io).catch((error: unknown) => error);
		expect(error).toBeInstanceOf(Error);
		expect(String(error)).toContain('<redacted>');
		expect(String(error)).not.toContain('fixture-error-secret');
		expect(String(error)).not.toContain('fixture-private-body');
	});

	it('uses the shared redactor only for explicitly requested CLI display redaction', async () => {
		const f = fixture();
		const values = { password: 'fixture-password', privateNote: 'fixture-note' };
		f.fetch.mockImplementation(async () => Response.json(values));
		const previous = setRedactor(createRedactor({ marker: '***', sensitiveKeys: ['privateNote'] }));
		try {
			await f.cli.executeLine('apollo read --read-format json --json', f.io);
			expect(JSON.parse(f.lines.pop()!)).toEqual(values);
			await f.cli.executeLine('apollo read --read-format json --redact --json', f.io);
			expect(JSON.parse(f.lines.pop()!)).toEqual({ password: '***', privateNote: '***' });
		} finally {
			setRedactor(previous);
		}
	});
});
