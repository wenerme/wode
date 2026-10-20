import { describe, expect, it } from 'vitest';
import { CliUsageError } from './CliCommand';
import { splitCliCommandLine } from './splitCliCommandLine';

describe('splitCliCommandLine', () => {
	it('splits quoted, escaped, and empty argv values without shell expansion', () => {
		expect(splitCliCommandLine(`service echo "hello world" 'single quoted' "" '' plain\\ value \\"`)).toEqual([
			'service',
			'echo',
			'hello world',
			'single quoted',
			'',
			'',
			'plain value',
			'"',
		]);
		expect(splitCliCommandLine('echo $HOME *.json $(whoami)')).toEqual(['echo', '$HOME', '*.json', '$(whoami)']);
	});

	it('rejects an unclosed quote or trailing escape', () => {
		expect(() => splitCliCommandLine("echo 'unfinished")).toThrow(CliUsageError);
		expect(() => splitCliCommandLine('echo trailing\\')).toThrow('trailing escape');
	});

	it('preserves backslashes inside single quoted JSON input', () => {
		const line = String.raw`service call system echo --input '{"text":"a\\b"}'`;
		const args = splitCliCommandLine(line);
		expect(args[5]).toBe(String.raw`{"text":"a\\b"}`);
		expect(JSON.parse(args[5])).toEqual({ text: String.raw`a\b` });
	});
});
