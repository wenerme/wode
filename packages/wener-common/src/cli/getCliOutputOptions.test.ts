import { describe, expect, it } from 'vitest';
import { resolveCliOutputSelection } from './CliCommand';
import { getCliOutputOptions } from './getCliOutputOptions';

describe('getCliOutputOptions', () => {
	it('resolves output DSL and terminal layout without ambient process state', () => {
		expect(
			getCliOutputOptions(
				{ term: { stdoutIsTTY: true, columns: 72, rows: 24 }, env: {} },
				{ output: 'csv', format: 'id,title', truncate: false },
			),
		).toMatchObject({ format: 'csv', fields: ['id', 'title'], w: 72, h: 24, truncate: false });
		expect(resolveCliOutputSelection({ format: 'value(name,id)' })).toEqual({
			format: 'value',
			fields: ['name', 'id'],
		});
		expect(getCliOutputOptions({ env: { NO_COLOR: '' } }, {}).styles?.header?.('ID')).toBe('ID');
	});

	it('rejects conflicting output selection', () => {
		expect(() => resolveCliOutputSelection({ output: 'csv', json: true })).toThrow('--json conflicts');
		expect(() => resolveCliOutputSelection({ format: 'id,id' })).toThrow('unique');
	});
});
