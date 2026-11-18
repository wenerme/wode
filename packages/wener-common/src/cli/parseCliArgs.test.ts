import { describe, expect, it } from 'vitest';
import { CliUsageError } from './CliCommand';
import { parseCliArgs, resolveCliOptions, safeCliToken, validateCliArguments } from './parseCliArgs';

describe('parseCliArgs', () => {
	const definitions = [
		{ name: 'query', aliases: ['q'], description: 'Query' },
		{ name: 'verbose', aliases: ['v'], description: 'Verbose', type: 'boolean' as const },
		{ name: 'tag', description: 'Tag', repeatable: true },
	];

	it('preserves strings, aliases, repeat values, and -- arguments', () => {
		const parsed = parseCliArgs(['-q', '00012', '--tag', 'one', '--tag', 'two', '--', '--literal'], definitions);
		expect(parsed).toEqual({ args: ['--literal'], options: { query: '00012', tag: ['one', 'two'] } });
		expect(resolveCliOptions(definitions, parsed.options)).toEqual({ query: '00012', tag: ['one', 'two'] });
	});

	it('reports stable usage errors without echoing unknown credential-like flags', () => {
		expect(() => parseCliArgs(['--sk-live-ABC123'], definitions)).toThrow(CliUsageError);
		expect(() => parseCliArgs(['--query', '-7d'], definitions)).toThrow('use --query=<value>');
		expect(() => validateCliArguments([], '<required>')).toThrow('Invalid command arguments');
		expect(safeCliToken('sk-live-ABC123')).toBeUndefined();
	});

	it('parses attached short values, booleans and explicit negative-looking string values', () => {
		expect(parseCliArgs(['-vq00012', '--tag=false', '--query=-7d', '--no-verbose'], definitions)).toEqual({
			args: [],
			options: { verbose: false, query: ['00012', '-7d'], tag: 'false' },
		});
		expect(() => resolveCliOptions(definitions, parseCliArgs(['-q', 'a', '-q', 'b'], definitions).options)).toThrow(
			'requires one value',
		);
		expect(() => parseCliArgs(['--query'], definitions)).toThrow('requires one value');
		expect(() => parseCliArgs(['--verbose=invalid'], definitions)).toThrow('requires a boolean');
		expect(() => validateCliArguments(['a', 'b'], '<one>')).toThrow();
		expect(() => validateCliArguments(['a', 'b'], '<one> [rest...]')).not.toThrow();
	});
});
