import { type CliCommand, CliUsageError } from '@wener/common/cli';
import { type RenderTuiTextOptions, renderTuiText, TuiTextRenderError } from 'common/tui';
import { optionNumber, optionString, readCommandText } from '../command-utils';
import type { WocliExecution } from '../createWocliCli';

function command(markdown: boolean): CliCommand<WocliExecution> {
	return {
		name: markdown ? 'markdown' : 'render',
		aliases: markdown ? ['md'] : undefined,
		description: markdown ? '渲染 Markdown 为终端文本' : '渲染 Markdown、JSON、YAML、JSONL 或文本',
		arguments: '[source]',
		output: 'custom',
		options: [
			{ name: 'text', description: '内联文本；不读取文件或 stdin' },
			{ name: 'input', description: 'auto | markdown | md | json | jsonl | yaml | code | text' },
			{ name: 'format', aliases: ['f'], description: 'terminal | text | md | json | jsonl | yaml | csv | table' },
			{ name: 'output', aliases: ['o'], description: '输出文件；- 或省略为 stdout' },
			{ name: 'width', description: '终端显示宽度，20..4096' },
			{ name: 'color', type: 'boolean', negatable: true, description: 'ANSI 样式；默认由宿主终端决定' },
			{ name: 'link', description: 'auto | always | never；always 允许 OSC 8 链接' },
		],
		async run({ args, options }, context) {
			const inline = optionString(options, 'text');
			const source = args[0] ?? '-';
			if (inline !== undefined && args.length) throw new CliUsageError('Choose --text or a source file');
			const input = optionString(options, 'input') ?? (markdown ? 'markdown' : 'auto');
			if (!['auto', 'markdown', 'md', 'json', 'jsonl', 'yaml', 'code', 'text'].includes(input))
				throw new CliUsageError('Unsupported render input');
			const link = optionString(options, 'link') ?? 'auto';
			if (!['auto', 'always', 'never'].includes(link)) throw new CliUsageError('Invalid --link mode');
			const format = optionString(options, 'format');
			const destination = optionString(options, 'output');
			if (destination && destination !== '-' && !context.host.writeText)
				throw new CliUsageError('Host does not support file output');
			const width = optionNumber(options, 'width', { min: 20, max: 4096, integer: true }) ?? context.columns;
			const text =
				inline ?? (await readCommandText(source === '-' || source.startsWith('@') ? source : `@${source}`, context));
			let rendered: string;
			try {
				rendered = renderTuiText(text, {
					input: input as RenderTuiTextOptions['input'],
					format: format as RenderTuiTextOptions['format'],
					source: inline !== undefined || source === '-' ? undefined : source.replace(/^@/, ''),
					width,
					color:
						destination && destination !== '-'
							? false
							: typeof options.color === 'boolean'
								? options.color
								: (context.host.term?.stdoutIsTTY ?? false),
					link: link as RenderTuiTextOptions['link'],
				});
			} catch (error) {
				if (error instanceof TuiTextRenderError || error instanceof RangeError) throw new CliUsageError(error.message);
				throw error;
			}
			context.signal.throwIfAborted();
			if (destination && destination !== '-')
				await context.host.writeText?.(destination, rendered, { signal: context.signal });
			else context.stdout(rendered);
		},
	};
}
export function createRenderCommands(): CliCommand<WocliExecution>[] {
	return [command(false), command(true)];
}
