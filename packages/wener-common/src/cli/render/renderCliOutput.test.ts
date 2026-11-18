import { describe, expect, it } from 'vitest';
import { CliUsageError } from '../CliCommand';
import { renderCliOutput } from './renderCliOutput';

describe('shared output rendering', () => {
	it('preserves raw structured output and applies explicit field projections', () => {
		const value = [{ id: '00012', nested: { count: 2 }, future: true }];
		expect(JSON.parse(renderCliOutput(value, { format: 'json' }))).toEqual(value);
		expect(JSON.parse(renderCliOutput(value, { format: 'json', fields: ['id', 'nested.count'] }))).toEqual([
			{ id: '00012', 'nested.count': 2 },
		]);
		expect(() => renderCliOutput(value, { format: 'json', fields: ['missing'] })).toThrow(CliUsageError);
	});
	it('quotes CSV cells and emits independent JSONL records', () => {
		const rows = [
			{ id: '01', text: 'a,b"c' },
			{ id: '02', text: 'next' },
		];
		expect(renderCliOutput(rows, { format: 'csv' })).toBe('id,text\n01,"a,b""c"\n02,next\n');
		expect(
			renderCliOutput(rows, { format: 'jsonl' })
				.trim()
				.split('\n')
				.map((line) => JSON.parse(line)),
		).toEqual(rows);
	});
});
