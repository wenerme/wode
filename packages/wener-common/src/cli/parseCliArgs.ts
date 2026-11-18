import { type CliOption, type CliOptions, CliUsageError } from './CliCommand';

/** 按命令声明解析，不读取进程 argv，也不对字符串选项做数字/布尔转换。 */
export function parseCliArgs(argv: readonly string[], definitions: readonly CliOption[]) {
	const args: string[] = [];
	const options: Record<string, string | string[] | boolean | undefined> = {};
	const dashValue = findDashValueOption(argv, definitions);
	if (dashValue)
		throw new CliUsageError(
			`--${dashValue} value starts with '-'; use --${dashValue}=<value> (relative times use now-7d, not -7d)`,
		);
	const set = (option: CliOption, value: string | boolean) => {
		const previous = options[option.name];
		if (typeof value === 'boolean' || previous === undefined) options[option.name] = value;
		else options[option.name] = [...(Array.isArray(previous) ? previous : [String(previous)]), value];
	};
	for (let index = 0; index < argv.length; index++) {
		const token = argv[index];
		if (token === '--') {
			args.push(...argv.slice(index + 1));
			break;
		}
		if (!token.startsWith('-') || token === '-') {
			args.push(token);
			continue;
		}
		const long = token.startsWith('--');
		const equals = token.indexOf('=');
		const flags = long
			? [token.slice(2, equals < 0 ? undefined : equals)]
			: [...token.slice(1, equals < 0 ? undefined : equals)];
		for (let flagIndex = 0; flagIndex < flags.length; flagIndex++) {
			const flag = flags[flagIndex];
			const option = findOption(definitions, `${long ? '--' : '-'}${flag}`);
			if (!option) {
				const label = safeCliToken(`${long ? '--' : '-'}${flag}`);
				throw new CliUsageError(
					label
						? `Unknown option: ${label}; run the command with --help`
						: 'Invalid or unknown option; run the command with --help',
				);
			}
			if (option.type === 'boolean') {
				const explicit = equals >= 0 && flagIndex === flags.length - 1 ? token.slice(equals + 1) : undefined;
				if (explicit !== undefined && explicit !== 'true' && explicit !== 'false')
					throw new CliUsageError(`--${option.name} requires a boolean`);
				const value = explicit === undefined ? true : explicit === 'true';
				set(option, long && flag.startsWith('no-') ? !value : value);
			} else {
				const attached = !long && flagIndex < flags.length - 1 ? token.slice(flagIndex + 2) : undefined;
				const value = attached ?? (equals >= 0 ? token.slice(equals + 1) : argv[++index]);
				if (value === undefined || (attached === undefined && equals < 0 && value.startsWith('-') && value !== '-'))
					throw new CliUsageError(`--${option.name} requires one value`);
				set(option, value);
				break;
			}
		}
	}
	return { args, options };
}

/** 仅回显像命令/选项名的 token。 */
export function safeCliToken(token: string): string | undefined {
	return /^-{0,2}[A-Za-z][A-Za-z-]{0,31}$/u.test(token) ? token : undefined;
}

function findOption(definitions: readonly CliOption[], token: string): CliOption | undefined {
	const long = token.startsWith('--');
	const name = long ? token.slice(2).split('=', 1)[0] : token.slice(1, 2);
	return definitions.find(
		(option) =>
			option.name === name ||
			option.aliases?.includes(name) ||
			(long && option.type === 'boolean' && name === `no-${option.name}`),
	);
}

function findDashValueOption(argv: readonly string[], definitions: readonly CliOption[]): string | undefined {
	for (let index = 0; index < argv.length - 1; index++) {
		const token = argv[index];
		if (token === '--') return undefined;
		if (!token.startsWith('-') || token.includes('=') || (!token.startsWith('--') && token.length > 2)) continue;
		const option = findOption(definitions, token);
		const next = argv[index + 1];
		if (!option || option.type === 'boolean' || !next?.startsWith('-') || next === '-' || next === '--') continue;
		if (/^-\d/u.test(next) || !findOption(definitions, next)) return option.name;
	}
	return undefined;
}

export function resolveCliOptions(definitions: readonly CliOption[], raw: CliOptions): CliOptions {
	const allowed = new Set(definitions.map((option) => option.name));
	for (const name of Object.keys(raw)) {
		if (!allowed.has(name))
			throw new CliUsageError(`Option --${name} does not belong to this command; run the command with --help`);
	}
	const options: Record<string, string | string[] | boolean | undefined> = {};
	for (const option of definitions) {
		const value = raw[option.name] ?? option.default;
		if (value === undefined) continue;
		if (option.type === 'boolean') {
			if (typeof value !== 'boolean') throw new CliUsageError(`--${option.name} requires a boolean`);
			options[option.name] = value;
		} else if (option.repeatable || option.variadic) {
			const values = Array.isArray(value) ? value : [value];
			if (!values.every((value) => typeof value === 'string' && value.length))
				throw new CliUsageError(`--${option.name} requires values`);
			options[option.name] = values as string[];
		} else {
			if (typeof value !== 'string' || !value.length) throw new CliUsageError(`--${option.name} requires one value`);
			options[option.name] = value;
		}
	}
	return options;
}

export function validateCliArguments(args: string[], syntax = ''): void {
	const parameters = syntax.match(/<[^>]+>|\[[^\]]+\]/gu) ?? [];
	const minimum = parameters.filter((parameter) => parameter.startsWith('<')).length;
	const maximum = parameters.some((parameter) => parameter.includes('...')) ? Infinity : parameters.length;
	if (args.length < minimum || args.length > maximum) {
		throw new CliUsageError('Invalid command arguments; run the command with --help');
	}
}
