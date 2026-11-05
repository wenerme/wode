import { describe, expect, test } from 'vitest';
import { renderCliOutput } from '../../../cli/render/renderCliOutput';
import { LinearCliOutputColumns, linearCliOutputKind, linearCliOutputRows, linearCliTable } from './output';

describe('Linear output projection', () => {
	test('every operation maps to its original human output columns', () => {
		for (const [operation, kind] of Object.entries({
			status: 'viewer',
			'team list': 'teams',
			'state list': 'states',
			'user list': 'users',
			'project list': 'projects',
			'issue list': 'issues',
			'issue get': 'issue',
			'issue create': 'issue',
			'issue update': 'issue',
			'comment list': 'comments',
			'comment create': 'comment',
		} as const)) {
			expect(linearCliOutputKind(operation)).toBe(kind);
			expect(linearCliTable(kind)({}).headers).toEqual(LinearCliOutputColumns[kind]);
		}
		for (const name of ['unknown', 'toString', '__proto__'])
			expect(() => linearCliOutputKind(name)).toThrow('Unknown Linear CLI operation');
	});

	test('tables flatten nested fields and preserve pagination cursors', () => {
		const table = linearCliTable('issues')({
			nodes: [
				{
					identifier: 'LIN-1',
					title: 'Title',
					state: { name: 'Started' },
					assignee: { name: 'Name', displayName: 'Display' },
					project: { name: 'Project' },
					priority: 2,
				},
			],
			pageInfo: { hasNextPage: true, endCursor: 'cursor' },
		});
		expect(table.rows[0]?.slice(0, 6)).toEqual(['LIN-1', 'Title', 'Started', 2, 'Display', 'Project']);
		expect(table.footer).toBe('1 item(s), next cursor');
		expect(
			linearCliTable('projects')({ nodes: [{ name: 'Project', status: { name: 'Active' } }] }).rows[0]?.slice(0, 2),
		).toEqual(['Project', 'Active']);
	});

	test('projections preserve raw JSON and use display-name fallback without mutating results', () => {
		const issue = {
			identifier: 'LIN-1',
			description: 'Full body',
			team: { id: 't' },
			state: { name: 'Started' },
			assignee: { name: 'Name', displayName: null },
			project: null,
		};
		const result = { nodes: [issue], pageInfo: { hasNextPage: false, endCursor: 'cursor' } };
		const snapshot = structuredClone(result);
		expect(linearCliOutputRows('issues', result)).toEqual([
			{ ...issue, state: 'Started', assignee: 'Name', project: undefined },
		]);
		linearCliTable('issues')(result);
		expect(result).toEqual(snapshot);
		expect(JSON.parse(JSON.stringify(result))).toMatchObject({
			nodes: [{ description: 'Full body', team: { id: 't' }, state: { name: 'Started' } }],
			pageInfo: { endCursor: 'cursor' },
		});
	});

	test('comments flatten authors, preserve body text and fall back to name', () => {
		expect(
			linearCliOutputRows('comment', { id: 'c', body: 'Body\nMore', user: { displayName: 'Display', name: 'Name' } }),
		).toEqual([{ id: 'c', body: 'Body\nMore', user: 'Display' }]);
		expect(linearCliOutputRows('comments', { nodes: [{ user: { name: 'Name' } }, { user: null }] })).toEqual([
			{ user: 'Name' },
			{ user: undefined },
		]);
	});

	test('the shared renderer retains full JSON and supports human field projections', () => {
		const result = {
			nodes: [
				{
					identifier: 'LIN-1',
					title: 'Title',
					description: 'Full body',
					team: { id: 't' },
					state: { name: 'Started' },
				},
			],
			pageInfo: { hasNextPage: true, endCursor: 'next' },
		};
		const table = linearCliTable('issues')(result);
		expect(JSON.parse(renderCliOutput(result, { format: 'json', table }))).toEqual(result);
		const text = renderCliOutput(result, { format: 'table', table, fields: ['identifier', 'title'] });
		expect(text).toContain('LIN-1');
		expect(text).toContain('Title');
		expect(text).not.toContain('Started');
		expect(text).toContain('next next');
		expect(renderCliOutput(result, { format: 'csv', table, fields: ['identifier', 'title'] })).toBe(
			'identifier,title\nLIN-1,Title\n',
		);
	});

	test('empty lists and nullable relations remain printable with accurate page footers', () => {
		expect(linearCliTable('issues')({ nodes: [], pageInfo: { hasNextPage: true, endCursor: 'next' } })).toMatchObject({
			rows: [],
			emptyMessage: 'No items.',
			footer: '0 item(s), next next',
		});
		expect(linearCliTable('issues')({ nodes: [], pageInfo: { hasNextPage: false } }).footer).toBe('0 item(s)');
		expect(
			linearCliTable('issue')({ identifier: 'LIN-1', state: null, assignee: null, project: null }).footer,
		).toBeUndefined();
		expect(linearCliOutputRows('issues', { nodes: [null, [], 'invalid', 1, { id: 'i' }] })).toEqual([
			{ id: 'i', state: undefined, assignee: undefined, project: undefined },
		]);
		for (const value of [null, undefined, [], 1, 'text']) expect(linearCliOutputRows('viewer', value)).toEqual([]);
	});
});
