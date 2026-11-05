import { describe, expect, test, vi } from 'vitest';
import { createServiceCliCommand } from '../../cli/createServiceCliCommand';
import type { ServiceCliOptions } from '../../cli/ServiceCliDefinition';
import { LinearServiceProvider } from '../../providers/linear';
import type { LinearServiceClient } from '../client';
import { LinearMethodInputs, LinearMethodOutputs, LinearServiceContract, LinearTools } from '../contract';
import { LinearOperations } from '../operations';
import { LinearCliDefinition } from './commands';
import {
	createLinearClientFixture,
	createLinearCliFixture,
	linearToolNames,
	linearOperation as operation,
} from './helper.fixture';

describe('Linear declarative CLI', () => {
	test('contract and provider operations share all eleven input and output schemas', () => {
		expect(Object.keys(LinearServiceContract.methods)).toEqual(linearToolNames);
		expect(Object.keys(LinearServiceProvider.operations ?? {})).toEqual(linearToolNames);
		for (const key of linearToolNames) {
			expect(LinearOperations[key].input).toBe(LinearMethodInputs[key]);
			expect(LinearOperations[key].tool).toBe(LinearTools[key]);
			expect(LinearTools[key].inputSchema).toBe(LinearServiceContract.methods[key].inputSchema);
			expect(LinearTools[key].outputSchema).toBe(LinearServiceContract.methods[key].outputSchema);
			expect(LinearMethodOutputs[key]).toBeDefined();
		}
	});
	test('retains all eleven operations and marks exactly the three mutations', () => {
		expect(
			LinearCliDefinition.commands.map((item) => `${'group' in item ? `${item.group} ` : ''}${item.name}`),
		).toEqual([
			'status',
			'team list',
			'state list',
			'user list',
			'project list',
			'issue list',
			'issue get',
			'issue create',
			'issue update',
			'comment list',
			'comment create',
		]);
		expect(
			LinearCliDefinition.commands.filter((item) => 'mutating' in item && item.mutating).map((item) => item.name),
		).toEqual(['create', 'update', 'create']);
	});

	test('all operations prepare typed DTOs and propagate cancellation', async () => {
		const client = createLinearClientFixture();
		const signal = new AbortController().signal;
		const cases: Array<[string, keyof typeof client, string[], ServiceCliOptions, object]> = [
			['status', 'getViewer', [], {}, {}],
			[
				'team list',
				'listTeam',
				[],
				{ limit: '7', after: 'cursor', 'include-archived': true },
				{ first: 7, after: 'cursor', includeArchived: true },
			],
			['state list', 'listIssueState', [], { team: 't' }, { teamId: 't', first: 50 }],
			['user list', 'listUser', [], { query: 'User' }, { query: 'User', first: 50 }],
			['project list', 'listProject', [], { team: 't', query: 'Project' }, { teamId: 't', query: 'Project' }],
			[
				'issue list',
				'listIssue',
				[],
				{ team: 't', assignee: 'u', project: 'p', state: 's', query: 'Issue', 'updated-after': '2026-10-01T00:00:00Z' },
				{
					teamId: 't',
					assigneeId: 'u',
					projectId: 'p',
					stateId: 's',
					query: 'Issue',
					updatedAfter: '2026-10-01T00:00:00Z',
				},
			],
			['issue get', 'getIssue', ['LIN-1'], {}, { id: 'LIN-1' }],
			[
				'issue create',
				'createIssue',
				['Title'],
				{ team: 't', yes: true, description: '  Text  ', label: ['a', 'b'], priority: '2', 'due-date': '2026-10-07' },
				{ teamId: 't', title: 'Title', description: 'Text', labelIds: ['a', 'b'], priority: 2, dueDate: '2026-10-07' },
			],
			[
				'issue update',
				'updateIssue',
				['LIN-1'],
				{ yes: true, 'clear-assignee': true, 'clear-project': true, 'clear-due-date': true },
				{ id: 'LIN-1', assigneeId: null, projectId: null, dueDate: null },
			],
			['comment list', 'listComment', ['LIN-1'], { after: 'cursor' }, { issueId: 'LIN-1', first: 50, after: 'cursor' }],
			[
				'comment create',
				'createComment',
				['LIN-1', '  Comment  '],
				{ yes: true },
				{ issueId: 'LIN-1', body: 'Comment' },
			],
		];
		for (const [name, method, args, options, expected] of cases) {
			const run = await operation(name).prepare({ args, options, readText: async (value) => value });
			await run(client, { signal });
			expect(client[method]).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(expected), { signal });
		}
	});

	test('confirmation, conflicts, malformed fields and empty updates fail before reading files', async () => {
		const readText = vi.fn(async () => 'text');
		for (const name of ['issue create', 'issue update', 'comment create']) {
			await expect(
				operation(name).prepare({ args: ['LIN-1', '@unread'], options: { description: '@unread' }, readText }),
			).rejects.toThrow('requires --yes');
		}
		for (const name of ['assignee', 'project', 'due-date']) {
			await expect(
				operation('issue update').prepare({
					args: ['LIN-1'],
					options: { yes: true, description: '@unread', [`clear-${name}`]: true, [name]: 'value' },
					readText,
				}),
			).rejects.toThrow(`--clear-${name} cannot be combined with --${name}`);
		}
		await expect(
			operation('issue update').prepare({ args: ['LIN-1'], options: { yes: true }, readText }),
		).rejects.toThrow('requires at least one change');
		await expect(
			operation('issue create').prepare({
				args: ['Title'],
				options: { team: 't', yes: true, priority: '5', description: '@unread' },
				readText,
			}),
		).rejects.toThrow('--priority');
		expect(readText).not.toHaveBeenCalled();
	});

	test('host receives bounded text requests and UTF-8 byte overflow is rejected', async () => {
		const readText = vi.fn(async () => '  File content\n');
		const run = await operation('comment create').prepare({
			args: ['LIN-1', '@body.md'],
			options: { yes: true },
			readText,
		});
		expect(readText).toHaveBeenCalledExactlyOnceWith('@body.md', { maxBytes: 100_000, label: 'Linear comment' });
		const client = createLinearClientFixture();
		await run(client, {});
		expect(client.createComment).toHaveBeenCalledWith(
			{ issueId: 'LIN-1', body: 'File content' },
			{ signal: undefined },
		);
		await expect(
			operation('comment create').prepare({
				args: ['LIN-1', '@body.md'],
				options: { yes: true },
				readText: async () => '界'.repeat(33_334),
			}),
		).rejects.toThrow('100000 bytes');
	});

	test('issue list reads JSON or @file filters only after validating basic options', async () => {
		const readText = vi.fn(async (value: string) =>
			value === '@filter.json' ? '{"or":[{"state":{"type":{"eq":"started"}}}]}' : value,
		);
		const inline = await operation('issue list').prepare({
			args: [],
			options: { limit: '7', filter: '{"priority":{"gt":0}}' },
			readText,
		});
		expect(readText).toHaveBeenCalledExactlyOnceWith('{"priority":{"gt":0}}', {
			maxBytes: 100_000,
			label: 'Linear issue filter',
		});
		const client = createLinearClientFixture();
		await inline(client, {});
		expect(client.listIssue).toHaveBeenCalledWith(
			expect.objectContaining({ first: 7, filter: { priority: { gt: 0 } } }),
			{ signal: undefined },
		);
		const file = await operation('issue list').prepare({ args: [], options: { filter: '@filter.json' }, readText });
		expect(readText).toHaveBeenLastCalledWith('@filter.json', { maxBytes: 100_000, label: 'Linear issue filter' });
		await file(client, {});
		expect(client.listIssue).toHaveBeenLastCalledWith(
			expect.objectContaining({ first: 50, filter: { or: [{ state: { type: { eq: 'started' } } }] } }),
			{ signal: undefined },
		);
		const invalidLimitRead = vi.fn(async () => '[]');
		await expect(
			operation('issue list').prepare({
				args: [],
				options: { limit: '101', filter: '@filter.json' },
				readText: invalidLimitRead,
			}),
		).rejects.toThrow('--limit');
		expect(invalidLimitRead).not.toHaveBeenCalled();
		for (const filter of ['[]', 'null', 'true', '1', '"text"']) {
			await expect(
				operation('issue list').prepare({ args: [], options: { filter }, readText: async (value) => value }),
			).rejects.toThrow('must be a JSON object');
		}
		await expect(
			operation('issue list').prepare({ args: [], options: { filter: '{invalid' }, readText: async (value) => value }),
		).rejects.toThrow('must contain valid JSON');
		await expect(
			operation('issue list').prepare({
				args: [],
				options: { filter: '@filter.json' },
				readText: async () => '界'.repeat(33_334),
			}),
		).rejects.toThrow('100000 bytes');
		expect(client.listIssue).toHaveBeenCalledTimes(2);
	});

	test('shared command mounting uses the same mutation input and file limits', async () => {
		const client = createLinearClientFixture();
		const readText = vi.fn(async () => 'Embedded file');
		const root = createServiceCliCommand<LinearServiceClient, undefined>(LinearCliDefinition, {
			readText,
			async run(op, _options, _context, prepare) {
				expect(op.mutating).toBe(true);
				await (await prepare())(client, {});
			},
		});
		const leaf = root.commands
			?.find((item) => item.name === 'comment')
			?.commands?.find((item) => item.name === 'create');
		await leaf?.run?.({ args: ['LIN-1', '@body.md'], options: { yes: true }, help: '' }, undefined);
		expect(readText).toHaveBeenCalledExactlyOnceWith('@body.md', undefined, {
			maxBytes: 100_000,
			label: 'Linear comment',
		});
		expect(client.createComment).toHaveBeenCalledWith(
			{ issueId: 'LIN-1', body: 'Embedded file' },
			{ signal: undefined },
		);
	});

	test('declarative parser preserves aliases, root options, repeated labels and clear flags', async () => {
		const { cli, client, context, emit } = createLinearCliFixture();
		await cli.execute(
			[
				'linear',
				'--context',
				'example',
				'issue',
				'update',
				'LIN-1',
				'--label',
				'a',
				'--label',
				'b',
				'--clear-assignee',
				'--yes',
			],
			context,
		);
		expect(client.updateIssue).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'LIN-1', labelIds: ['a', 'b'], assigneeId: null }),
			{ signal: context.signal },
		);
		expect(emit.mock.calls[0]?.[1].context).toBe('example');
		expect(emit.mock.calls[0]?.[2]).toMatchObject({ group: 'issue', name: 'update', table: expect.any(Function) });
		await cli.execute(['linear', 'team', 'ls', '--after', 'cursor', '--include-archived'], context);
		expect(client.listTeam).toHaveBeenCalledWith(
			{ first: 50, after: 'cursor', includeArchived: true },
			{ signal: context.signal },
		);
	});

	test.each(['team', 'state', 'user', 'project', 'issue', 'comment'])(
		'%s ls parses pagination with the same defaults',
		async (group) => {
			const { cli, client, context } = createLinearCliFixture();
			const args = ['linear', group, 'ls', '--limit', '1', '--after', 'next'];
			if (group === 'state') args.push('--team', 't');
			if (group === 'comment') args.push('LIN-1');
			await cli.execute(args, context);
			const method = {
				team: 'listTeam',
				state: 'listIssueState',
				user: 'listUser',
				project: 'listProject',
				issue: 'listIssue',
				comment: 'listComment',
			}[group] as keyof typeof client;
			expect(client[method]).toHaveBeenCalledWith(expect.objectContaining({ first: 1, after: 'next' }), {
				signal: context.signal,
			});
		},
	);

	test('all update fields, single labels and description-only updates reach the service', async () => {
		const { cli, client, context, readText } = createLinearCliFixture({ files: { 'body.md': '  Description\n' } });
		await cli.execute(
			[
				'linear',
				'issue',
				'update',
				'LIN-1',
				'--title',
				'  Revised  ',
				'--description',
				'@body.md',
				'--state',
				's',
				'--assignee',
				'u',
				'--project',
				'p',
				'--priority',
				'0',
				'--due-date',
				'2026-10-07',
				'--label',
				'a',
				'--yes',
			],
			context,
		);
		expect(client.updateIssue).toHaveBeenLastCalledWith(
			expect.objectContaining({
				id: 'LIN-1',
				title: 'Revised',
				description: 'Description',
				stateId: 's',
				assigneeId: 'u',
				projectId: 'p',
				priority: 0,
				dueDate: '2026-10-07',
				labelIds: ['a'],
			}),
			{ signal: context.signal },
		);
		expect(readText).toHaveBeenCalledWith('@body.md', context, {
			maxBytes: 100_000,
			label: 'Linear issue description',
		});
		await cli.execute(
			['linear', 'issue', 'update', 'LIN-1', '--description', '  Only description  ', '--yes'],
			context,
		);
		expect(client.updateIssue).toHaveBeenLastCalledWith(
			{ id: 'LIN-1', description: 'Only description' },
			{ signal: context.signal },
		);
	});

	test('help, describe, discovery and malformed input never create a client or read a file', async () => {
		const { cli, context, createClient, readText, root } = createLinearCliFixture();
		expect(cli.describe()[0]?.commands).toHaveLength(7);
		for (const args of [
			['linear', '--help'],
			['linear', 'issue', 'create', '--help'],
			['linear', '--list-services'],
		])
			await cli.execute(args, context);
		expect(root).toHaveBeenCalledTimes(1);
		for (const args of [
			['linear', 'comment', 'create', 'LIN-1'],
			['linear', 'issue', 'create', 'Title', '--team', 't', '--description', '@unread'],
			['linear', 'issue', 'get', 'LIN-1', 'extra'],
			['linear', 'issue', 'list', '--filter', '@unread', '--updated-after', 'invalid'],
			['linear', 'issue', 'list', '--list-services'],
			['linear', 'state', 'list', '--include-archived'],
			['linear', 'comment', 'list', 'LIN-1', '--include-archived'],
		])
			await expect(cli.execute(args, context)).rejects.toThrow();
		expect(createClient).not.toHaveBeenCalled();
		expect(readText).not.toHaveBeenCalled();
	});

	test('the host can enforce read-only admission before prepare or @file input', async () => {
		const { cli, context, createClient, readText } = createLinearCliFixture({ readOnly: true });
		for (const args of [
			['linear', 'comment', 'create', 'LIN-1', '@unread', '--yes'],
			['linear', 'issue', 'create', 'Title', '--team', 't', '--description', '@unread', '--yes'],
			['linear', 'issue', 'update', 'LIN-1', '--description', '@unread', '--yes'],
		])
			await expect(cli.execute(args, context)).rejects.toThrow('read-only');
		expect(createClient).not.toHaveBeenCalled();
		expect(readText).not.toHaveBeenCalled();
	});

	test('virtual @file input rejects bad UTF-8, whitespace and excessive bytes before client creation', async () => {
		for (const [content, message] of [
			[new Uint8Array([0xc3, 0x28]), 'valid UTF-8'],
			[' \n ', 'must not be empty'],
			['界'.repeat(33_334), '100000 bytes'],
		] as const) {
			const { cli, context, createClient } = createLinearCliFixture({ files: { 'body.md': content } });
			await expect(cli.execute(['linear', 'comment', 'create', 'LIN-1', '@body.md', '--yes'], context)).rejects.toThrow(
				message,
			);
			expect(createClient).not.toHaveBeenCalled();
		}
	});

	test('exact byte boundaries are accepted through the declarative builder', async () => {
		for (const content of ['a'.repeat(100_000), `${'界'.repeat(33_333)}a`]) {
			const { cli, context, client } = createLinearCliFixture({ files: { 'body.md': content } });
			await cli.execute(['linear', 'comment', 'create', 'LIN-1', '@body.md', '--yes'], context);
			expect(client.createComment).toHaveBeenCalledWith(
				{ issueId: 'LIN-1', body: content },
				{ signal: context.signal },
			);
		}
	});
});
