import { CliUsageError } from './CliCommand';

/**
 * 将 Web 终端输入切分为 argv。它只实现引号和反斜杠，不进行变量、glob、命令替换或其他 shell 展开。
 */
export function splitCliCommandLine(input: string): string[] {
	const argv: string[] = [];
	let value = '';
	let started = false;
	let quote: 'single' | 'double' | undefined;
	let escaping = false;

	for (const character of input) {
		if (escaping) {
			value += character;
			started = true;
			escaping = false;
			continue;
		}
		if (quote === 'single') {
			if (character === "'") quote = undefined;
			else value += character;
			continue;
		}
		if (character === '\\') {
			escaping = true;
			started = true;
			continue;
		}
		if (quote === 'double') {
			if (character === '"') quote = undefined;
			else value += character;
			continue;
		}
		if (character === "'") {
			quote = 'single';
			started = true;
			continue;
		}
		if (character === '"') {
			quote = 'double';
			started = true;
			continue;
		}
		if (/\s/u.test(character)) {
			if (started) {
				argv.push(value);
				value = '';
				started = false;
			}
			continue;
		}
		value += character;
		started = true;
	}

	if (escaping) throw new CliUsageError('Invalid command line: trailing escape');
	if (quote) throw new CliUsageError('Invalid command line: unclosed quote');
	if (started) argv.push(value);
	return argv;
}
