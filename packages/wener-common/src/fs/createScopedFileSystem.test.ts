import { describe, expect, test } from 'vitest';
import { createMemoryFileSystem } from './createMemoryFileSystem';
import { createScopedFileSystem } from './createScopedFileSystem';

describe('createScopedFileSystem', () => {
	test('maps paths and stats to a logical root', async () => {
		const base = createMemoryFileSystem();
		await base.mkdir('/workspace', { recursive: true });
		await base.writeFile('/workspace/readme.txt', 'hello');
		const scoped = createScopedFileSystem(base, '/workspace');

		expect(scoped.root).toBe('/workspace');
		expect(await scoped.readFile('/readme.txt', { encoding: 'text' })).toBe('hello');
		expect(await scoped.stat('/readme.txt')).toMatchObject({ path: '/readme.txt', directory: '/' });
		await scoped.writeFile('/nested/value.txt', 'value');
		expect(await base.readFile('/workspace/nested/value.txt', { encoding: 'text' })).toBe('value');
	});

	test('normalizes traversal while remaining inside the configured scope', async () => {
		const base = createMemoryFileSystem();
		const scoped = createScopedFileSystem(base, '/workspace');

		await scoped.writeFile('/a/../../outside', 'value');
		expect(await base.readFile('/workspace/outside', { encoding: 'text' })).toBe('value');
		expect(await base.exists('/outside')).toBe(false);
	});

	test('normalizes double slash and backslash forms without escaping the scope', async () => {
		const base = createMemoryFileSystem();
		await base.mkdir('/workspace', { recursive: true });
		const scoped = createScopedFileSystem(base, '/workspace');

		expect(await scoped.exists('//..')).toBe(true);
		await scoped.writeFile('//../second/escaped.txt', 'value');
		expect(await base.readFile('/workspace/second/escaped.txt', { encoding: 'text' })).toBe('value');
		expect(await base.exists('/second/escaped.txt')).toBe(false);
		await scoped.writeFile('\\nested\\value.txt', 'nested');
		expect(await base.readFile('/workspace/nested/value.txt', { encoding: 'text' })).toBe('nested');
	});

	test('preserves stream capabilities while remapping paths', async () => {
		const base = createMemoryFileSystem();
		const scoped = createScopedFileSystem(base, '/workspace');
		await scoped.writeFile('/source.txt', 'source');

		const stream = scoped.createReadableStream?.('/source.txt');
		expect(stream).toBeDefined();
		expect(new TextDecoder().decode(await new Response(stream).arrayBuffer())).toBe('source');

		const writer = scoped.createWritableStream?.('/target.txt')?.getWriter();
		expect(writer).toBeDefined();
		await writer!.write('target');
		await writer!.close();
		expect(await base.readFile('/workspace/target.txt', { encoding: 'text' })).toBe('target');
	});
});
