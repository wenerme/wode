import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod/v4';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import { linearOperation } from './helper.fixture';
import {
	linearDescription,
	linearInteger,
	linearIssueFields,
	linearPageInput,
	linearParseInput,
	linearReadText,
	linearRequiredOption,
	linearRequireMutation,
} from './input';

describe('Linear input validation', () => {
	test('parses typed schema output and reports the first issue without the input value', () => {
		expect(linearParseInput(z.object({ name: z.string().trim() }), { name: '  Name  ' })).toEqual({ name: 'Name' });
		expect(() => linearParseInput(z.object({ field: z.number() }), { field: 'hidden-value' })).toThrow(
			ServiceCliInputError,
		);
		expect(() => linearParseInput(z.object({ field: z.number() }), { field: 'hidden-value' })).toThrow(
			'Invalid field:',
		);
		try {
			linearParseInput(z.object({ field: z.number() }), { field: 'hidden-value' });
		} catch (error) {
			expect(String(error)).not.toContain('hidden-value');
		}
	});

	test('required options are trimmed and confirmation must be boolean true', () => {
		expect(linearRequiredOption({ team: '  t  ' }, 'team')).toBe('t');
		for (const team of [undefined, '', ' \n '])
			expect(() => linearRequiredOption({ team }, 'team')).toThrow('--team is required');
		for (const yes of [undefined, false, 'true', ['true']])
			expect(() => linearRequireMutation({ yes })).toThrow('requires --yes');
		expect(linearRequireMutation({ yes: true })).toBeUndefined();
	});

	test('pagination and priority preserve defaults and both integer bounds', () => {
		expect(linearPageInput({})).toEqual({ first: 50, after: undefined, includeArchived: false });
		for (const limit of ['1', '100']) expect(linearPageInput({ limit }).first).toBe(Number(limit));
		for (const priority of ['0', '4']) expect(linearIssueFields({ priority }).priority).toBe(Number(priority));
		for (const value of ['', ' ', '0', '101', '1.5', 'NaN', 'Infinity', '9007199254740992'])
			expect(() => linearInteger({ limit: value }, 'limit', 1, 100)).toThrow('--limit');
		for (const value of ['-1', '5', '1.5', ''])
			expect(() => linearInteger({ priority: value }, 'priority', 0, 4)).toThrow('--priority');
		expect(linearInteger({}, 'limit', 1, 100)).toBeUndefined();
	});

	test('rejects repeated scalar options and supports one or repeated labels', () => {
		expect(() => linearPageInput({ limit: ['1', '2'] })).toThrow('--limit requires one value');
		expect(() => linearRequiredOption({ team: ['t', 'u'] }, 'team')).toThrow('--team requires one value');
		expect(linearIssueFields({ label: 'a' }).labelIds).toEqual(['a']);
		expect(linearIssueFields({ label: ['a', 'b'] }).labelIds).toEqual(['a', 'b']);
		expect(() => linearIssueFields({ label: true })).toThrow('--label requires a value');
	});

	test.each([
		['issue create', ['Title'], { yes: true, description: '@unread' }],
		['issue create', [' '], { yes: true, team: 't', description: '@unread' }],
		['issue create', ['x'.repeat(513)], { yes: true, team: 't', description: '@unread' }],
		['issue create', ['Title'], { yes: true, team: 't', description: '@unread', 'due-date': '2026-02-30' }],
		['issue create', ['Title'], { yes: true, team: 't', description: '@unread', state: '' }],
		[
			'issue create',
			['Title'],
			{ yes: true, team: 't', description: '@unread', label: Array(101).fill('a') as string[] },
		],
		['issue update', [' '], { yes: true, description: '@unread' }],
		['issue update', ['LIN-1'], { yes: true, description: '@unread', assignee: '' }],
		['issue list', [], { filter: '@unread', 'updated-after': 'bad' }],
		['issue list', [], { filter: '@unread', after: '' }],
		['issue list', [], { filter: '@unread', query: ' ' }],
		['comment create', [' ', '@unread'], { yes: true }],
	] as const)('%s validates non-file fields before reading a file (%#)', async (name, args, options) => {
		const readText = vi.fn(async () => 'Text');
		await expect(
			Promise.resolve().then(() => linearOperation(name).prepare({ args, options, readText })),
		).rejects.toThrow(ServiceCliInputError);
		expect(readText).not.toHaveBeenCalled();
	});

	test('description absence does not read input; trim and byte budgets apply before whitespace removal', async () => {
		const readText = vi.fn(async (value: string) => value);
		expect(await linearDescription({ args: [], options: {}, readText })).toBeUndefined();
		expect(readText).not.toHaveBeenCalled();
		expect(await linearDescription({ args: [], options: { description: '  Body\n' }, readText })).toBe('Body');
		for (const body of ['', ' \n ', ' '.repeat(100_001), `${'a'.repeat(100_000)} `, '界'.repeat(33_334)]) {
			await expect(linearReadText({ args: [], options: {}, readText }, body, 'Input')).rejects.toThrow(
				ServiceCliInputError,
			);
		}
		for (const body of ['a'.repeat(100_000), '界'.repeat(33_333), '😀'.repeat(25_000)]) {
			expect(await linearReadText({ args: [], options: {}, readText }, body, 'Input')).toBe(body);
		}
	});

	test('host read failures stop preparation without replacing the error', async () => {
		const failure = new Error('Fixture reader failure');
		const readText = vi.fn(async () => {
			throw failure;
		});
		await expect(
			linearOperation('comment create').prepare({ args: ['LIN-1', '@body.md'], options: { yes: true }, readText }),
		).rejects.toBe(failure);
	});
});
