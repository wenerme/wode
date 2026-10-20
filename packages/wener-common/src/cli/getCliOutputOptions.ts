import { getAnsiStyle } from '@wener/utils/ansi';
import { type CliOptions, resolveCliOutputSelection } from './CliCommand';
import { type CliTerminalInfo, cliTerminalSize } from './CliRuntime';
import type { CliFormatOptions } from './format/types';
import type { CliTable } from './render/CliTable';

/** 原始结构化输出跳过领域展示投影；显式字段选择仍使用同一列定义。 */
export function getCliOutputTable(options: CliOptions, createTable: () => CliTable | undefined): CliTable | undefined {
	const selection = resolveCliOutputSelection(options);
	return !selection.fields && ['json', 'jsonl', 'yaml', 'yml'].includes(selection.format) ? undefined : createTable();
}

/** 宿主适配层负责采样；纯 formatter 只接收显式布局与样式函数。 */
export function getCliOutputOptions(
	context: { columns?: number; term?: CliTerminalInfo; env?: Readonly<Record<string, string | undefined>> },
	options: CliOptions = {},
): CliFormatOptions {
	const style = getAnsiStyle({
		enabled: typeof options['output-file'] === 'string' && options['output-file'] !== '-' ? false : 'auto',
		env: { ...context.env },
		stream: { isTTY: context.term?.stdoutIsTTY ?? false },
	});
	return {
		...resolveCliOutputSelection(options),
		w: context.columns ?? cliTerminalSize(context.term?.columns) ?? cliTerminalSize(context.env?.COLUMNS),
		h: cliTerminalSize(context.term?.rows) ?? cliTerminalSize(context.env?.LINES),
		styles: { title: style.bold, header: style.bold, label: style.cyan, footer: style.dim, empty: style.dim },
		truncate: typeof options.truncate === 'boolean' ? options.truncate : undefined,
		headers: options.headers !== false,
		footer: options.footer !== false,
	};
}
