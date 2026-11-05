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
	});

	it('prepares list without requiring arguments or confirmation', async () => {
		const client = { listObject: vi.fn(async () => []) } as unknown as IS3Service;
		const run = await operation('list').prepare(context());
		await run(client, {});
		expect(client.listObject).toHaveBeenCalledWith({}, {});
	});

	it('passes list options through', async () => {
		const client = { listObject: vi.fn(async () => []) } as unknown as IS3Service;
		const run = await operation('list').prepare(context([], { prefix: 'uploads/', delimiter: '/', 'max-keys': '10' }));
		await run(client, {});
		expect(client.listObject).toHaveBeenCalledWith({ delimiter: '/', prefix: 'uploads/', maxKeys: 10 }, {});
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

	it('requires --content for put', async () => {
		await expect(operation('put').prepare(context(['foo.txt'], { yes: true }))).rejects.toThrow('--content is required');
	});

	it('rejects put without --yes', async () => {
		await expect(operation('put').prepare(context(['foo.txt'], { content: 'hi' }))).rejects.toThrow('requires --yes');
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
