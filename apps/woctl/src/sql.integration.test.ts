import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createCli } from './createCli';
import { createNativeSqlDriver } from './native/sql';

describe('woctl SQL service integration', () => {
	it('executes parameterized SQL and discovers tables through the shared registry', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'woctl-sql-'));
		try {
			const lines: string[] = [];
			const cli = createCli({
				config: createMemoryCliConfigStore({
					services: [
						{ name: 'db', type: 'sqlite', readOnly: false, options: { filename: join(directory, 'db.sqlite') } },
					],
					defaults: { sql: 'db' },
				}),
				sqlDriver: createNativeSqlDriver,
			});
			const io = { signal: new AbortController().signal, stdout: (text: string) => lines.push(text) };
			expect((await cli.describe()).some((command) => command.name === 'sql')).toBe(true);
			await cli.execute(
				['sql', 'exec', 'CREATE TABLE sample (id INTEGER PRIMARY KEY, value TEXT)', '--yes', '--json'],
				io,
			);
			await cli.execute(
				['sql', 'exec', 'INSERT INTO sample (value) VALUES (?)', '--params', '["bound value"]', '--yes', '--json'],
				io,
			);
			await cli.execute(['sql', 'query', 'SELECT value FROM sample WHERE id = ?', '--params', '[1]', '--json'], io);
			expect(JSON.parse(lines.pop()!)).toMatchObject({ columns: ['value'], rows: [{ value: 'bound value' }] });
			await cli.execute(['sql', 'table', 'list', '--json'], io);
			expect(JSON.parse(lines.pop()!)).toContainEqual(expect.objectContaining({ name: 'sample' }));
			await cli.execute(['sql', 'table', 'info', 'sample', '--json'], io);
			expect(JSON.parse(lines.pop()!)).toMatchObject({
				object: { name: 'sample' },
				children: [{ name: 'id' }, { name: 'value' }],
			});
			await cli.execute(['sql', 'ping', '--json'], io);
			expect(JSON.parse(lines.pop()!)).toMatchObject({ ok: true });
			await cli.execute(['sql', 'query', 'SELECT value FROM sample'], io);
			expect(lines.pop()).toContain('bound value');
			await expect(cli.execute(['sql', 'query', 'DELETE FROM sample'], io)).rejects.toThrow();
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	});
	it('blocks unconfirmed and read-only writes before reading input or creating a driver', async () => {
		const readText = vi.fn();
		const sqlDriver = vi.fn();
		const io = { signal: new AbortController().signal, stdout: vi.fn() };
		const make = (readOnly: boolean) =>
			createCli({
				config: createMemoryCliConfigStore({ services: [{ name: 'db', type: 'sql', readOnly }] }),
				readText,
				sqlDriver,
			});
		await expect(make(false).execute(['sql', 'exec', '@query.sql'], io)).rejects.toThrow('--yes');
		await expect(make(true).execute(['sql', 'exec', '@query.sql', '--yes'], io)).rejects.toThrow('read-only');
		expect(readText).not.toHaveBeenCalled();
		expect(sqlDriver).not.toHaveBeenCalled();
	});
});
