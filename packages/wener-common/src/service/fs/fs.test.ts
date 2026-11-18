import type { FetchLike } from '@wener/utils';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryFileSystem } from '../../fs/createMemoryFileSystem';
import { createWebDavMockServer } from '../../fs/tests/createWebDavMockServer';
import { toJsonSchema } from '../../schema';
import type { ServiceCliInputContext } from '../cli/ServiceCliDefinition';
import { normalizeCliServices } from '../config';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import type { ServiceProviderDefinition } from '../registry';
import { FsCliDefinition } from './cli';
import { createFsServiceToolClient } from './client';
import type { IFsService } from './IFsService';
import {
	createFsServiceProvider, decodeFsBase64, encodeFsBase64, FsOperations, FsServiceContract, FsServiceProvider,
	FsWriteOperations, parseFsUrl, redactFsUrl,
} from './index';

const keys = ['list', 'stat', 'read', 'write', 'mkdir', 'rm', 'mv', 'cp'];
const env: Record<string, string> = { FS_USER: 'fixture-user', FS_PASS: 'fixture-secret', FS_TOKEN: 'fixture-token' };

function setup({
	url = 'webdavs://dav.example.test/dav/',
	readOnly = true,
	fetch,
	provider = FsServiceProvider,
	extra = { usernameEnv: 'FS_USER', passwordEnv: 'FS_PASS' } as Record<string, unknown>,
}: { url?: string; readOnly?: boolean; fetch?: FetchLike; provider?: ServiceProviderDefinition<IFsService>; extra?: Record<string, unknown> } = {}) {
	const server = createWebDavMockServer();
	server.files.set('/a.txt', new TextEncoder().encode('hello world'));
	const fetchMock = vi.fn<FetchLike>(fetch ?? ((input, init) => server.fetch(input as string, init)));
	const getEnv = vi.fn((name: string) => env[name]);
	const runtime = createServiceRuntime({
		context: { services: normalizeCliServices([{ name: 'files', type: 'fs', readOnly, options: { url, ...extra } }]) },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(provider)]),
		fetch: fetchMock as unknown as typeof globalThis.fetch,
		getEnv,
	});
	const call = (toolName: string, input: unknown) => runtime.call({ params: { service: 'files' }, body: { toolName, input } });
	return { runtime, server, fetch: fetchMock, getEnv, call };
}

describe('parseFsUrl', () => {
	it('resolves schemes', () => {
		expect(parseFsUrl('/srv/data')).toEqual({ kind: 'local', root: '/srv/data' });
		expect(parseFsUrl('./data')).toEqual({ kind: 'local', root: './data' });
		expect(parseFsUrl('file:///srv/my%20data')).toEqual({ kind: 'local', root: '/srv/my data' });
		expect(parseFsUrl('s3://s3.example.test/bucket/a/b?region=eu-1')).toEqual({
			kind: 's3', endpoint: 'https://s3.example.test', bucket: 'bucket', prefix: 'a/b', region: 'eu-1',
		});
		expect(parseFsUrl('s3+http://localhost:9000/bucket')).toMatchObject({ endpoint: 'http://localhost:9000', prefix: '' });
		expect(parseFsUrl('webdav://dav.example.test/dav')).toEqual({ kind: 'webdav', url: 'http://dav.example.test/dav' });
		expect(parseFsUrl('webdavs://dav.example.test/dav')).toEqual({ kind: 'webdav', url: 'https://dav.example.test/dav' });
		expect(parseFsUrl('https://dav.example.test/x/')).toEqual({ kind: 'webdav', url: 'https://dav.example.test/x/' });
	});

	it('splits and redacts credentials and never echoes them in errors', () => {
		const parsed = parseFsUrl('webdavs://user:fixture-secret@dav.example.test/dav');
		expect(parsed).toEqual({
			kind: 'webdav', url: 'https://dav.example.test/dav', credentials: { username: 'user', password: 'fixture-secret' },
		});
		expect(parseFsUrl('s3://key:fixture-secret@s3.example.test/b')).toMatchObject({
			endpoint: 'https://s3.example.test', credentials: { username: 'key', password: 'fixture-secret' },
		});
		expect(redactFsUrl('webdavs://user:fixture-secret@dav.example.test/dav')).toBe('webdavs://***@dav.example.test/dav');
		for (const bad of ['https://user:fixture-secret@[bad', 'ftp://user:fixture-secret@host/', 's3://user:fixture-secret@host/', ''])
			expect(() => parseFsUrl(bad)).toThrow(expect.objectContaining({ message: expect.not.stringContaining('fixture-secret') }));
		expect(() => parseFsUrl('file://remote.example.test/x')).toThrow('remote host');
	});
});

describe('Fs contract', () => {
	it('aligns contract, operations, tools and write metadata', () => {
		const tools = createServiceProviderAdapter(FsServiceProvider).tools!;
		expect(Object.keys(FsServiceContract)).toEqual(keys);
		expect(Object.keys(FsOperations)).toEqual(keys);
		expect(Object.keys(tools)).toEqual(keys);
		for (const name of keys) expect(tools[name]!.annotations?.readOnlyHint).toBe(!FsWriteOperations.has(name));
		expect(tools.rm!.annotations?.destructiveHint).toBe(true);
		expect(tools.mv!.annotations?.destructiveHint).toBe(true);
		expect(tools.write!.annotations?.destructiveHint).toBe(true);
		expect(tools.cp!.annotations?.destructiveHint).toBe(true);
		expect(tools.mkdir!.annotations?.destructiveHint).toBe(false);
	});

	it('defaults and bounds inputs', () => {
		expect(FsServiceContract.list['~orpc'].inputSchema!.parse(undefined)).toEqual({ path: '/', maxEntries: 1000 });
		const read = FsServiceContract.read['~orpc'].inputSchema!;
		expect(read.parse({ path: 'a' })).toEqual({ path: 'a', encoding: 'utf8', maxBytes: 1024 * 1024 });
		expect(read.safeParse({ path: 'a', maxBytes: 17 * 1024 * 1024 }).success).toBe(false);
		expect(read.safeParse({ path: 'a/../b' }).success).toBe(false);
		expect(FsServiceContract.list['~orpc'].inputSchema!.safeParse({ maxEntries: 10_001 }).success).toBe(false);
	});

	it('exports AJV-compilable schemas', () => {
		const ajv = new Ajv2020({ strict: false, validateFormats: false });
		for (const procedure of Object.values(FsServiceContract)) {
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].inputSchema!))).not.toThrow();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].outputSchema!))).not.toThrow();
		}
	});

	it('round-trips Base64 without Buffer', () => {
		const bytes = new Uint8Array([0, 1, 254, 255]);
		expect([...decodeFsBase64(encodeFsBase64(bytes))]).toEqual([...bytes]);
		expect(() => decodeFsBase64('@@@')).toThrow('Invalid Base64');
	});
});

describe('Fs provider: WebDAV', () => {
	it('discovers schema without credentials or network', async () => {
		const test = setup();
		expect(Object.keys((await test.runtime.getSchema({ params: { service: 'files' } })).tools)).toEqual(keys);
		expect(test.getEnv).not.toHaveBeenCalled();
		expect(test.fetch).not.toHaveBeenCalled();
	});

	it('lists, stats and reads with bounded content and basic auth', async () => {
		const test = setup();
		expect(await test.call('list', {})).toEqual([expect.objectContaining({ path: '/a.txt', kind: 'file', size: 11 })]);
		const [entry] = (await test.call('list', {})) as Array<{ mtime?: string }>;
		expect(entry?.mtime).toBe('2024-01-01T00:00:00.000Z');
		const headers = test.fetch.mock.calls[0]![1]!.headers as Record<string, string>;
		expect(headers.Authorization).toBe(`Basic ${btoa('fixture-user:fixture-secret')}`);
		expect(String(test.fetch.mock.calls[0]![0])).toMatch(/^https:\/\/dav\.example\.test\/dav\//u);
		await expect(test.call('stat', { path: '/missing' })).resolves.toBeNull();
		await expect(test.call('read', { path: '/a.txt', maxBytes: 5 })).resolves.toEqual({
			path: '/a.txt', encoding: 'utf8', content: 'hello', size: 5, truncated: true,
		});
		await expect(test.call('read', { path: '/a.txt', encoding: 'base64' })).resolves.toMatchObject({
			content: btoa('hello world'), truncated: false,
		});
	});

	it('reads an empty file despite 416 on the bounded Range request', async () => {
		const test = setup();
		test.server.files.set('/empty.txt', new Uint8Array());
		await expect(test.call('read', { path: '/empty.txt' })).resolves.toEqual({
			path: '/empty.txt', encoding: 'utf8', content: '', size: 0, truncated: false,
		});
	});

	it('uses bearer tokens and inline URL credentials', async () => {
		const bearer = setup({ extra: { tokenEnv: 'FS_TOKEN' } });
		await bearer.call('list', {});
		expect((bearer.fetch.mock.calls[0]![1]!.headers as Record<string, string>).Authorization).toBe('Bearer fixture-token');
		const inline = setup({ url: 'webdavs://u:p@dav.example.test/dav/', extra: {} });
		await inline.call('list', {});
		expect((inline.fetch.mock.calls[0]![1]!.headers as Record<string, string>).Authorization).toBe(`Basic ${btoa('u:p')}`);
		expect(String(inline.fetch.mock.calls[0]![0])).not.toContain('u:p@');
	});

	it('refuses writes on read-only services before credentials or requests', async () => {
		const test = setup();
		for (const [toolName, input] of [
			['write', { path: '/b', content: 'x' }], ['mkdir', { path: '/d' }], ['rm', { path: '/a.txt' }],
			['mv', { from: '/a.txt', to: '/b' }], ['cp', { from: '/a.txt', to: '/b' }],
		] as const) await expect(test.call(toolName, input)).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
		expect(test.getEnv).not.toHaveBeenCalled();
	});

	it('performs writes when writable and exposes only stable error codes', async () => {
		const test = setup({ readOnly: false });
		await expect(test.call('write', { path: '/b.bin', content: 'AAE=', encoding: 'base64' })).resolves.toEqual({ path: '/b.bin', size: 2 });
		expect([...test.server.files.get('/b.bin')!]).toEqual([0, 1]);
		await expect(test.call('write', { path: '/b.bin', content: 'x' })).rejects.toThrow('EEXIST');
		await test.call('mkdir', { path: '/d/e', recursive: true });
		await test.call('cp', { from: '/a.txt', to: '/d/a.txt' });
		await test.call('mv', { from: '/d/a.txt', to: '/d/e/a.txt' });
		await expect(test.call('rm', { path: '/d' })).rejects.toThrow('ENOTEMPTY');
		await test.call('rm', { path: '/d', recursive: true });
		expect(test.server.dirs.has('/d')).toBe(false);
		await expect(test.call('rm', { path: '/missing', force: true })).resolves.toEqual({ path: '/missing' });
	});

	it('sanitizes backend errors', async () => {
		const test = setup({ fetch: async () => { throw new Error('connect https://u:fixture-secret@dav.example.test'); } });
		const error = (await test.call('list', {}).catch((e: unknown) => e)) as Error;
		expect(String(error)).not.toContain('fixture-secret');
	});

	it('fails lazily when credentials are missing', async () => {
		const test = setup({ extra: { tokenEnv: 'MISSING' } });
		await expect(test.runtime.getSchema({ params: { service: 'files' } })).resolves.toBeDefined();
		await expect(test.call('list', {})).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
	});

	it('close() aborts an in-flight request', async () => {
		let seen: AbortSignal | undefined;
		const { fs } = await FsServiceProvider.create({
			name: 'files',
			config: { provider: 'fs', readOnly: true, options: { url: 'https://dav.example.test/' } },
			context: { services: {} },
			fetch: ((_: unknown, init?: RequestInit) => {
				seen = init?.signal ?? undefined;
				return new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal!.reason)));
			}) as typeof globalThis.fetch,
		});
		const pending = fs.list();
		await new Promise((resolve) => setTimeout(resolve, 0));
		await fs.close();
		await expect(pending).rejects.toThrow();
		expect(seen?.aborted).toBe(true);
	});
});

describe('Fs provider: local and S3', () => {
	it('requires a host-injected local filesystem', async () => {
		await expect(setup({ url: '/srv/data', extra: {} }).call('list', {})).rejects.toThrow('not available');
		const memory = createMemoryFileSystem();
		await memory.writeFile('/x.txt', 'local');
		const createLocalFileSystem = vi.fn(() => memory);
		const test = setup({ url: 'file:///srv/data', extra: {}, provider: createFsServiceProvider({ createLocalFileSystem }), readOnly: false });
		await expect(test.call('read', { path: '/x.txt' })).resolves.toMatchObject({ content: 'local' });
		expect(createLocalFileSystem).toHaveBeenCalledWith({ root: '/srv/data' });
		await test.call('write', { path: '/y.txt', content: 'new' });
		expect(await memory.readFile('/y.txt', { encoding: 'text' })).toBe('new');
	});

	it('signs S3 requests against the bucket endpoint without leaking credentials', async () => {
		const test = setup({
			url: 's3://s3.example.test/bucket/prefix?region=eu-1',
			fetch: async () => new Response('<Error><Code>AccessDenied</Code><Message>fixture-secret</Message></Error>', { status: 403 }),
		});
		const error = (await test.call('stat', { path: '/a.txt' }).catch((e: unknown) => e)) as Error;
		expect(String(error)).not.toContain('fixture-secret');
		const [url, init] = test.fetch.mock.calls[0]!;
		expect(String(url)).toMatch(/^https:\/\/s3\.example\.test\/bucket\/prefix/u);
		expect(String(url)).not.toContain('fixture');
		const auth = new Headers(init?.headers as HeadersInit).get('authorization') ?? '';
		expect(auth).toContain('fixture-user');
		expect(auth).not.toContain('fixture-secret');
	});

	it('rejects backslash escapes for S3 before any fetch', async () => {
		const test = setup({ url: 's3://k:s@s3.example.test/bucket/pfx', extra: {} });
		await expect(test.call('read', { path: '..\\..\\other-bucket\\secret' })).rejects.toThrow();
		await expect(test.call('stat', { path: 'a\u0001b' })).rejects.toThrow();
		expect(test.fetch).not.toHaveBeenCalled();
	});

	it('prefers the host runtime createLocalFileSystem port', async () => {
		const memory = createMemoryFileSystem();
		await memory.writeFile('/p.txt', 'port');
		const port = vi.fn(() => memory);
		const fallback = vi.fn(() => createMemoryFileSystem());
		const runtime = createServiceRuntime({
			context: { services: normalizeCliServices([{ name: 'files', type: 'fs', options: { url: '/srv/data' } }]) },
			providers: new ServiceProviderRegistry([createServiceProviderAdapter(createFsServiceProvider({ createLocalFileSystem: fallback }))]),
			fetch: globalThis.fetch,
			createLocalFileSystem: port,
		});
		await expect(runtime.call({ params: { service: 'files' }, body: { toolName: 'read', input: { path: '/p.txt' } } }))
			.resolves.toMatchObject({ content: 'port' });
		expect(port).toHaveBeenCalledWith({ root: '/srv/data' });
		expect(fallback).not.toHaveBeenCalled();
	});

	it('never hands backslash or .. paths to a host local filesystem', async () => {
		const memory = createMemoryFileSystem();
		const seen: string[] = [];
		const recording = new Proxy(memory, {
			get(target, property, receiver) {
				const value = Reflect.get(target, property, receiver);
				if (typeof value !== 'function') return value;
				return (...args: unknown[]) => {
					for (const arg of args) if (typeof arg === 'string') seen.push(arg);
					return value.apply(target, args);
				};
			},
		});
		const test = setup({ url: '/srv/data', extra: {}, readOnly: false, provider: createFsServiceProvider({ createLocalFileSystem: () => recording }) });
		for (const path of ['..\\etc\\passwd', '../etc/passwd', 'a/../../b', 'a\\b'])
			await expect(test.call('read', { path })).rejects.toThrow();
		await expect(test.call('mv', { from: '/a', to: '..\\x' })).rejects.toThrow();
		await test.call('write', { path: '/ok.txt', content: 'x' });
		expect(seen).toEqual(['/ok.txt']);
	});

	it('requires S3 credentials lazily', async () => {
		const test = setup({ url: 's3://s3.example.test/bucket', extra: {} });
		await expect(test.runtime.getSchema({ params: { service: 'files' } })).resolves.toBeDefined();
		await expect(test.call('list', {})).rejects.toThrow('requires credentials');
	});
});

describe('Fs tool client', () => {
	it('enforces read-only and validates output', async () => {
		const test = setup({ readOnly: false });
		const client = await createFsServiceToolClient(test.runtime, 'files');
		await expect(client.mkdir({ path: '/d' })).rejects.toThrow('read-only');
		await expect(client.list()).resolves.toHaveLength(1);
		await client.close();
	});
});

const command = (name: string) => FsCliDefinition.commands.find((entry) => entry.name === name)!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({
	args, options, readText: vi.fn(async (value: string) => value),
});

describe('Fs CLI', () => {
	it('names, aliases and mutating set', () => {
		expect(FsCliDefinition.name).toBe('fs');
		expect(FsCliDefinition.commands.filter((entry) => entry.mutating).map((entry) => entry.name))
			.toEqual(['write', 'mkdir', 'rm', 'mv', 'cp']);
	});

	it('requires --yes before reading input for mutations', async () => {
		const input = context(['a.txt'], { content: '@file' });
		await expect(command('write').prepare(input)).rejects.toThrow('requires --yes');
		expect(input.readText).not.toHaveBeenCalled();
		for (const [name, args] of [['mkdir', ['d']], ['rm', ['a']], ['mv', ['a', 'b']], ['cp', ['a', 'b']]] as const)
			expect(() => command(name).prepare(context([...args]))).toThrow('requires --yes');
	});

	it('prepares inputs', async () => {
		const service = {
			read: vi.fn(async () => ({})), write: vi.fn(async () => ({})), mv: vi.fn(async () => ({})),
			list: vi.fn(async () => []), rm: vi.fn(async () => ({})),
		} as unknown as IFsService;
		await (await command('list').prepare(context(['/d'], { recursive: true, 'max-entries': '5', kind: 'file' })))(service, {});
		expect(service.list).toHaveBeenCalledWith({ path: '/d', recursive: true, maxEntries: 5, kind: 'file' }, {});
		await (await command('read').prepare(context(['a'], { encoding: 'base64', 'max-bytes': '10' })))(service, {});
		expect(service.read).toHaveBeenCalledWith({ path: 'a', encoding: 'base64', maxBytes: 10 }, {});
		await (await command('write').prepare(context(['a'], { content: 'hi', yes: true, overwrite: true })))(service, {});
		expect(service.write).toHaveBeenCalledWith({ path: 'a', content: 'hi', overwrite: true }, {});
		await (await command('mv').prepare(context(['a', 'b'], { yes: true })))(service, {});
		expect(service.mv).toHaveBeenCalledWith({ from: 'a', to: 'b', overwrite: false }, {});
		await (await command('rm').prepare(context(['a'], { yes: true, recursive: true })))(service, {});
		expect(service.rm).toHaveBeenCalledWith({ path: 'a', recursive: true, force: false }, {});
		expect(() => command('read').prepare(context(['a'], { encoding: 'hex' }))).toThrow('--encoding');
		expect(() => command('list').prepare(context([], { kind: 'link' }))).toThrow('--kind');
	});
});
