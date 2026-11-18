import { expect, it } from 'vitest';
import { expandCliVariadicOptions } from './expandCliVariadicOptions';

it('expands only declared variadic option values and preserves --', () => {
	expect(
		expandCliVariadicOptions(
			['--kind', 'a', 'b', '--query', 'one', '--', 'two'],
			[
				{ name: 'kind', description: '', variadic: true },
				{ name: 'query', description: '' },
			],
		),
	).toEqual(['--kind', 'a', '--kind', 'b', '--query', 'one', '--', 'two']);
});
