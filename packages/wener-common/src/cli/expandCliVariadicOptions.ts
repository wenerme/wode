import type { CliOption } from './CliCommand';

/** 将连续多值转换为重复选项，继续由共享解析器验证类型与业务作用域。 */
export function expandCliVariadicOptions(argv: readonly string[], options: readonly CliOption[]): string[] {
	const flags = new Map<string, CliOption>(
		options.flatMap((option) =>
			[option.name, ...(option.aliases ?? [])].map(
				(name) => [`${name.length === 1 ? '-' : '--'}${name}`, option] as const,
			),
		),
	);
	const result: string[] = [];
	for (let index = 0; index < argv.length; index++) {
		const token = argv[index]!;
		if (token === '--') {
			result.push(...argv.slice(index));
			break;
		}
		result.push(token);
		const equal = token.indexOf('=');
		const flag = equal < 0 ? token : token.slice(0, equal);
		const option = flags.get(flag);
		if (!option || option.type === 'boolean') continue;
		if (equal < 0 && index + 1 < argv.length) result.push(argv[++index]!);
		if (!option.variadic) continue;
		while (index + 1 < argv.length && !argv[index + 1]!.startsWith('-')) {
			result.push(flag, argv[++index]!);
		}
	}
	return result;
}
