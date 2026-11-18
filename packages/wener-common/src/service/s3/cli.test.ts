import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import { S3CliDefinition } from './cli';
import type { IS3Service } from './IS3Service';

const operation = (name: string) => S3CliDefinition.commands.find((entry) => entry.name === name)!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({
	args,
	options,
	readText: vi.fn(async (value: string) => value),
});

describe('S3 CLI preparation', () => {
	it('exposes the s3 name and s3mini alias', () => {
		expect(S3CliDefinition.name).toBe('s3');
		expect(S3CliDefinition.aliases).toContain('s3mini');
		expect(S3CliDefinition.commands.filter((entry) => entry.mutating).map((entry) => entry.name)).toEqual(['put', 'delete']);
	});

	it('prepares list without requiring arguments or confirmation', async () => {
		const client = { listObject: vi.fn(async () => []) } as unknown as IS3Service;
		const run = await operation('list').prepare(context());
		await run(client, {});
		expect(client.listObject).toHaveBeenCalledWith({}, {});
	});

	it('passes list options through', async () => {
		const objects = [{ Key: 'uploads/fixture.txt', token: 'FIXTURE_TOKEN' }];
		const client = { listObject: vi.fn(async () => objects) } as unknown as IS3Service;
		const run = await operation('list').prepare(context([], { prefix: 'uploads/', delimiter: '/', 'max-keys': '10', redact: true }));
		expect(await run(client, {})).toBe(objects);
		expect(client.listObject).toHaveBeenCalledWith({ delimiter: '/', prefix: 'uploads/', maxKeys: 10 }, {});
		expect(objects[0].token).toBe('FIXTURE_TOKEN');
	});

	it('rejects an invalid --max-keys value', async () => {
		expect(() => operation('list').prepare(context([], { 'max-keys': 'abc' }))).toThrow(ServiceCliInputError);
	});

	it('requires a key for get', async () => {
		expect(() => operation('get').prepare(context([]))).toThrow('key is required');
	});

	it('reads an object', async () => {
		const client = { getObject: vi.fn(async () => 'content') } as unknown as IS3Service;
		const run = await operation('get').prepare(context(['foo.txt']));
		const result = await run(client, {});
		expect(client.getObject).toHaveBeenCalledWith({ key: 'foo.txt' }, {});
		expect(result).toBe('content');
	});

	it('round-trips sensitive-looking object text through get and put without changing its content', async () => {
		const content = '{ "password": "FIXTURE_PASSWORD", "message": "Bearer FIXTURE_TOKEN" }\r\n'
			+ 'https://fixture:fixture@example.test/object\r\n中文\u0000';
		const objects = new Map([['source.txt', content]]);
		const response = { ok: true, status: 200, etag: '"Bearer FIXTURE_ETAG"' };
		const client = {
			getObject: vi.fn(async ({ key }: { key: string }) => objects.get(key) ?? null),
			putObject: vi.fn(async ({ key, content }: { key: string; content: string }) => {
				objects.set(key, content);
				return response;
			}),
		} as unknown as IS3Service;
		const read = await operation('get').prepare(context(['source.txt'], { redact: true }));
		const value = await read(client, {});
		expect(value).toBe(content);
		if (typeof value !== 'string') throw new Error('Expected object text');
		const input = context(['copy.txt'], { content: value, yes: true, redact: true });
		const write = await operation('put').prepare(input);
		expect(await write(client, {})).toBe(response);
		expect(client.putObject).toHaveBeenCalledWith({ key: 'copy.txt', content }, {});
		const readCopy = await operation('get').prepare(context(['copy.txt']));
		expect(await readCopy(client, {})).toBe(content);
		expect(response.etag).toBe('"Bearer FIXTURE_ETAG"');
	});

	it('requires --content for put', async () => {
		await expect(operation('put').prepare(context(['foo.txt'], { yes: true }))).rejects.toThrow('--content is required');
	});

	it('rejects put without --yes', async () => {
		const input = context(['foo.txt'], { content: '@fixture.txt' });
		await expect(operation('put').prepare(input)).rejects.toThrow('requires --yes');
		expect(input.readText).not.toHaveBeenCalled();
	});

	it('writes an object with --yes', async () => {
		const client = { putObject: vi.fn(async () => ({ ok: true, status: 200 })) } as unknown as IS3Service;
		const run = await operation('put').prepare(context(['foo.txt'], { content: 'hi', 'content-type': 'text/plain', yes: true }));
		await run(client, {});
		expect(client.putObject).toHaveBeenCalledWith({ key: 'foo.txt', content: 'hi', contentType: 'text/plain' }, {});
	});

	it('requires a key for delete', async () => {
		expect(() => operation('delete').prepare(context([], { yes: true }))).toThrow('key is required');
	});

	it('rejects delete without --yes', async () => {
		expect(() => operation('delete').prepare(context(['foo.txt']))).toThrow('requires --yes');
	});

	it('deletes an object with --yes', async () => {
		const client = { deleteObject: vi.fn(async () => true) } as unknown as IS3Service;
		const run = await operation('delete').prepare(context(['foo.txt'], { yes: true }));
		await run(client, {});
		expect(client.deleteObject).toHaveBeenCalledWith({ key: 'foo.txt' }, {});
	});
});
