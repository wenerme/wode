import type { ServiceRuntimeClient } from '@wener/common/service';
import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createCli, type CliHost } from './createCli';

const methods = ['getViewer', 'listTeam', 'listIssueState', 'listUser', 'listProject', 'listIssue', 'getIssue', 'createIssue', 'updateIssue', 'listComment', 'createComment'] as const;
const writes = new Set<string>(['createIssue', 'updateIssue', 'createComment']);

function fixture(readOnly = true, writeText?: CliHost['writeText']) {
	const tools = Object.fromEntries(methods.map((name) => [name, { inputSchema: { type: 'object' }, annotations: { readOnlyHint: !writes.has(name) } }]));
	const getSchema = vi.fn<ServiceRuntimeClient['getSchema']>(async () => ({ tools }));
	const call = vi.fn<ServiceRuntimeClient['call']>(async ({ body }) => ({ operation: body.toolName, input: body.input }));
	const getEnv = vi.fn(() => { throw new Error('Credentials must stay lazy'); });
	const readText = vi.fn(async (value: string) => value.includes('filter.json') ? '{"priority":{"eq":1}}' : 'Example body');
	const cli = createCli({
		config: createMemoryCliConfigStore({ services: [{ name: 'work', type: 'linear', readOnly, options: { apiKeyEnv: 'EXAMPLE_LINEAR_KEY' } }] }),
		runtime: { getSchema, call }, getEnv, readText, writeText,
	});
	const lines: string[] = [];
	const controller = new AbortController();
	const signal = controller.signal;
	return { cli, getSchema, call, getEnv, readText, lines, signal, controller, io: { signal, stdout: (line: string) => lines.push(line) } };
}

describe('Linear registered service commands', () => {
	it('discovers all eleven operations and commands without resolving credentials or creating clients', async () => {
		const { cli, getSchema, call, getEnv, readText, io } = fixture();
		const provider = cli.catalog().providers.find((provider) => provider.name === 'linear');
		expect(Object.keys(provider?.contract?.methods ?? {}).sort()).toEqual([...methods].sort());
		expect(Object.keys(provider?.tools ?? {}).sort()).toEqual([...methods].sort());
		expect(provider?.optionsSchema).toHaveProperty('properties.apiKeyEnv');
		expect((await cli.describe()).some((command) => command.name === 'linear')).toBe(true);
		for (const line of ['linear --help', 'linear issue create --help', 'linear --list-services --json', 'service type linear --typescript'])
			await cli.executeLine(line, io);
		expect(getSchema).not.toHaveBeenCalled();
		expect(call).not.toHaveBeenCalled();
		expect(getEnv).not.toHaveBeenCalled();
		expect(readText).not.toHaveBeenCalled();
	});

	it.each([
		['status', 'getViewer'],
		['team ls --limit 2 --after cursor --include-archived', 'listTeam'],
		['state ls --team team-id --limit 2', 'listIssueState'],
		['user ls --query Ada', 'listUser'],
		['project ls --team team-id --query Launch', 'listProject'],
		['issue ls --team team-id --assignee user-id --state state-id --project project-id --query bug --updated-after 2026-01-01T00:00:00Z --filter @filter.json', 'listIssue'],
		['issue get EX-1', 'getIssue'],
		['issue create "Fix regression" --team team-id --description @body.md --yes', 'createIssue'],
		['issue update EX-1 --clear-assignee --clear-project --clear-due-date --yes', 'updateIssue'],
		['comment ls EX-1 --limit 2 --after cursor', 'listComment'],
		['comment create EX-1 @body.md --yes', 'createComment'],
	])('routes the complete source command: %s', async (command, method) => {
		const { cli, call, getEnv, lines, io, controller } = fixture(false);
		await cli.executeLine(`linear ${command} --json`, io);
		expect(call).toHaveBeenCalledWith({ params: { service: 'work' }, body: { toolName: method, input: expect.any(Object) } }, { signal: expect.any(AbortSignal) });
		expect(JSON.parse(lines.join(''))).toMatchObject({ operation: method });
		if (method === 'listIssue') expect(call.mock.calls[0]?.[0].body.input).toMatchObject({ filter: { priority: { eq: 1 } } });
		if (method === 'updateIssue') expect(call.mock.calls[0]?.[0].body.input).toMatchObject({ assigneeId: null, projectId: null, dueDate: null });
		expect(getEnv).not.toHaveBeenCalled();
		const cancellation = new Error('Fixture cancelled');
		controller.abort(cancellation);
		expect(call.mock.calls[0]?.[1]?.signal).toMatchObject({ aborted: true, reason: cancellation });
	});

	it.each([
		'issue create "Title" --team team-id --description @body.md',
		'issue update EX-1 --description @body.md',
		'comment create EX-1 @body.md',
	])('rejects mutation before reading files, credentials or tool schema: %s', async (command) => {
		for (const readOnly of [true, false]) {
			const { cli, getSchema, call, getEnv, readText, io } = fixture(readOnly);
			await expect(cli.executeLine(`linear ${command}`, io)).rejects.toThrow();
			expect(getSchema).not.toHaveBeenCalled();
			expect(call).not.toHaveBeenCalled();
			expect(getEnv).not.toHaveBeenCalled();
			expect(readText).not.toHaveBeenCalled();
		}
		const { cli, getSchema, call, readText, io } = fixture();
		await expect(cli.executeLine(`linear ${command} --yes`, io)).rejects.toThrow('read-only');
		expect(getSchema).not.toHaveBeenCalled();
		expect(call).not.toHaveBeenCalled();
		expect(readText).not.toHaveBeenCalled();
	});

	it('hides unconfigured and disabled Linear commands while keeping static discovery', async () => {
		for (const services of [[], [{ name: 'work', type: 'linear', disabled: true }]]) {
			const cli = createCli({ config: createMemoryCliConfigStore({ services }) });
			expect(cli.catalog().commands.some((command) => command.name === 'linear')).toBe(true);
			expect((await cli.describe()).some((command) => command.name === 'linear')).toBe(false);
			await expect(cli.executeLine('linear status', { signal: new AbortController().signal, stdout: () => undefined })).rejects.toThrow('Unknown command');
		}
	});

	it('preserves formatted file output and validates host support before executing a mutation', async () => {
		const unsupported = fixture(false);
		await expect(unsupported.cli.executeLine('linear issue create "Title" --team team-id --description @body.md --yes --output-file result.json', unsupported.io)).rejects.toThrow('Host does not support file output');
		expect(unsupported.readText).not.toHaveBeenCalled();
		expect(unsupported.getSchema).not.toHaveBeenCalled();
		expect(unsupported.call).not.toHaveBeenCalled();
		const writeText = vi.fn<NonNullable<CliHost['writeText']>>(async () => undefined);
		const supported = fixture(true, writeText);
		await supported.cli.executeLine('linear issue get EX-1 --json --output-file result.json', supported.io);
		expect(supported.lines).toEqual([]);
		expect(JSON.parse(writeText.mock.calls[0]![1])).toEqual({ operation: 'getIssue', input: { id: 'EX-1' } });
		expect(writeText).toHaveBeenCalledWith('result.json', expect.any(String), { signal: supported.signal });
		await supported.cli.executeLine('linear status --json --output-file -', supported.io);
		expect(supported.lines).toHaveLength(1);
		expect(writeText).toHaveBeenCalledTimes(1);
	});
});
