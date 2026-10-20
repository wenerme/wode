import { type CliCommand, CliUsageError } from '@wener/common/cli';
import { executePrompt, type PromptRequest, preparePromptRequest, redactPromptRequest } from 'common/ai/prompt';
import { type AiProtocol, parsePromptTemplate, renderPromptTemplate, resolveAiModel } from 'common/context';
import { renderTerminalMarkdown } from 'common/tui';
import {
	changeCommandConfig,
	loadCommandContext,
	optionNumber,
	optionString,
	optionStrings,
	readCommandText,
	setConfigEntry,
	writeCommandOutput,
} from '../command-utils';
import type { WocliExecution } from '../createWocliCli';
import { getPromptPreset, presetMessages, promptVariables } from './prompt-input';

const variableOptions = [
	{ name: 'var', description: '模板变量 name=value 或 name=@file，可重复', repeatable: true },
	{ name: 'input', description: '模板变量 name=value，可重复', repeatable: true },
];

function mode(options: Readonly<Record<string, unknown>>, fallback = 'text'): string {
	const value = options.output ?? fallback;
	if (typeof value !== 'string' || !['text', 'json', 'jsonl', 'md', 'markdown'].includes(value))
		throw new CliUsageError('Prompt output must be text, json, jsonl or markdown');
	return value;
}
export function createPromptCommand(): CliCommand<WocliExecution> {
	return {
		name: 'prompt',
		aliases: ['p'],
		description: '使用当前 context 的模型生成文本，支持模板与请求预览',
		output: 'custom',
		arguments: '[text...]',
		options: [
			{ name: 'model', aliases: ['m'], description: '模型别名或 provider/model' },
			{ name: 'provider', description: '指定 AI provider' },
			{ name: 'protocol', description: '覆盖协议：openai/openai-response/anthropic/gemini' },
			{ name: 'prompt', aliases: ['p'], description: '额外提示词、@文件或 -；可重复', repeatable: true },
			{ name: 'system', aliases: ['s'], description: '系统提示词或 @文件' },
			{ name: 'message', description: '附加 role:content 消息，可重复', repeatable: true },
			{ name: 'temperature', description: '采样温度 0..2' },
			{ name: 'top-p', description: 'Top-p 采样 0..1' },
			{ name: 'max-output-tokens', description: '输出 token 上限（Anthropic 必须显式配置）' },
			{ name: 'output', aliases: ['o'], description: 'text | json 完整结果 | jsonl | markdown' },
			{ name: 'json', type: 'boolean', description: '要求模型返回 JSON object' },
			{ name: 'jsonschema', description: '要求 JSON Schema：JSON 或 @文件' },
			{ name: 'dump', type: 'boolean', description: '仅输出隐藏凭据后的请求，不访问网络' },
			{ name: 'stream', type: 'boolean', negatable: true, description: '通过 SSE 流式生成；Node 支持逐块输出' },
			...variableOptions,
		],
		commands: [
			{
				name: 'list',
				aliases: ['ls'],
				description: '列出当前 context 的 prompt presets',
				async run({ options }, context) {
					const resolved = await loadCommandContext(context, options);
					writeCommandOutput(
						Object.entries(resolved.prompts ?? {}).map(([name, preset]) => ({
							name,
							title: preset.title,
							description: preset.description,
							model: preset.model,
						})),
						options,
						context,
					);
				},
			},
			{
				name: 'show',
				arguments: '<name>',
				description: '显示 prompt preset；--json 输出完整配置',
				async run({ args, options }, context) {
					const resolved = await loadCommandContext(context, options);
					const preset = await getPromptPreset(args[0], resolved.prompts ?? {}, context);
					if (options.json || options.output) writeCommandOutput({ name: args[0], ...preset }, options, context);
					else context.stdout(preset.template);
				},
			},
			{
				name: 'import',
				arguments: '<name> [source]',
				description: '导入 .prompt.md 的 YAML frontmatter 和模板正文',
				options: [{ name: 'text', description: '直接导入模板文本' }],
				async run({ args, options }, context) {
					const text = optionString(options, 'text');
					const source =
						text ??
						(await readCommandText(
							args[1] ? (args[1].startsWith('@') || args[1] === '-' ? args[1] : `@${args[1]}`) : '-',
							context,
						));
					const preset = parsePromptTemplate(source);
					await changeCommandConfig(context, options, (config, name) => {
						config.contexts[name].prompts ??= {};
						setConfigEntry(config.contexts[name].prompts, args[0], preset);
					});
				},
			},
			{
				name: 'remove',
				arguments: '<name>',
				description: '删除当前 context 自有的 prompt preset',
				run: ({ args, options }, context) =>
					changeCommandConfig(context, options, (config, name) => {
						if (!Object.hasOwn(config.contexts[name].prompts ?? {}, args[0]))
							throw new CliUsageError('Prompt is not configured in this context');
						delete config.contexts[name].prompts?.[args[0]];
					}),
			},
			{
				name: 'render',
				arguments: '<name>',
				description: '只渲染模板与变量，不调用模型',
				output: 'custom',
				options: variableOptions,
				async run({ args, options }, context) {
					const selected = await loadCommandContext(context, options);
					const preset = await getPromptPreset(args[0], selected.prompts ?? {}, context);
					const rendered = renderPromptTemplate(preset, await promptVariables(options, context));
					const format = mode(options);
					if (options.json || format === 'json') context.stdout(JSON.stringify(rendered, null, 2));
					else
						context.stdout(
							format === 'md' || format === 'markdown'
								? renderTerminalMarkdown(rendered.template, {
										color: context.host.term?.stdoutIsTTY ?? false,
										width: context.columns,
									})
								: rendered.template,
						);
				},
			},
		],
		async run({ args, options }, context) {
			const format = mode(options);
			const extraMessages = optionStrings(options, 'message').map((item) => {
				const split = item.indexOf(':');
				const role = item.slice(0, split);
				if (split < 1 || !['user', 'assistant', 'system'].includes(role))
					throw new CliUsageError('--message must use user:content, assistant:content or system:content');
				return { role, source: item.slice(split + 1) };
			});
			const selected = await loadCommandContext(context, options);
			const variables = await promptVariables(options, context);
			const messages: PromptRequest['messages'] = [];
			let preset: Awaited<ReturnType<typeof getPromptPreset>> | undefined;
			let remaining = args;
			if (args[0]?.startsWith('@')) {
				preset = await getPromptPreset(args[0], selected.prompts ?? {}, context);
				remaining = args.slice(1);
				messages.push(...presetMessages(preset, variables));
			}
			const parts: string[] = [];
			if (remaining.length) parts.push(remaining.join(' '));
			for (const value of optionStrings(options, 'prompt')) parts.push(await readCommandText(value, context));
			if (!preset && !parts.length && !extraMessages.length) {
				if (context.host.term?.stdinIsTTY) throw new CliUsageError('Provide prompt text or pipe stdin');
				parts.push(await readCommandText('-', context));
			}
			if (parts.some((part) => part.trim()))
				messages.push({ role: 'user', content: [{ type: 'text', text: parts.join('\n') }] });
			for (const { role, source } of extraMessages) {
				messages.push({
					role,
					content: [{ type: 'text', text: await readCommandText(source, context) }],
				});
			}
			if (!messages.length) throw new CliUsageError('Prompt text is empty');
			const protocol = optionString(options, 'protocol');
			if (
				protocol &&
				![
					'openai',
					'openai-compatible',
					'openai-response',
					'openai-responses',
					'openai-chat-completions',
					'anthropic',
					'anthropic-messages',
					'gemini',
					'google-generative-ai',
				].includes(protocol)
			)
				throw new CliUsageError('Unknown prompt protocol');
			const target = resolveAiModel(selected, {
				model: optionString(options, 'model') ?? preset?.model,
				provider: optionString(options, 'provider'),
				protocol: protocol as AiProtocol | undefined,
				env: context.host.env,
				getEnv: context.host.getEnv,
				requireKey: !options.dump,
			});
			const maxOutputTokens =
				optionNumber(options, 'max-output-tokens', { min: 1, integer: true }) ??
				preset?.maxOutputTokens ??
				target.config.maxOutputTokens;
			if (target.target.api === 'anthropic' && !maxOutputTokens)
				throw new CliUsageError('Anthropic requires --max-output-tokens or an explicit model default');
			const system = optionString(options, 'system');
			const request: PromptRequest = {
				target: target.target,
				model: target.model,
				messages,
				system: system
					? await readCommandText(system, context)
					: preset
						? renderPromptTemplate(preset, variables).system
						: undefined,
				maxOutputTokens,
				temperature:
					optionNumber(options, 'temperature', { min: 0, max: 2 }) ?? preset?.temperature ?? target.config.temperature,
				topP: optionNumber(options, 'top-p', { min: 0, max: 1 }),
				stream: options.stream === true,
			};
			const schema = optionString(options, 'jsonschema');
			if (schema) {
				let value: unknown;
				try {
					value = JSON.parse(await readCommandText(schema, context));
				} catch {
					throw new CliUsageError('--jsonschema requires valid JSON or @file');
				}
				if (!value || typeof value !== 'object' || Array.isArray(value))
					throw new CliUsageError('JSON schema must be an object');
				request.responseFormat = { type: 'json_schema', name: 'response', schema: value, strict: true };
			} else if (options.json) request.responseFormat = { type: 'json_object' };
			if (options.dump) {
				context.stdout(JSON.stringify(redactPromptRequest(preparePromptRequest(request)), null, 2));
				return;
			}
			let wrote = false;
			const run = context.host.generate ?? executePrompt;
			const result = await run(request, {
				fetch: context.host.fetch,
				signal: context.signal,
				onText:
					request.stream && format === 'text' && context.write
						? (text) => {
								context.signal.throwIfAborted();
								wrote = true;
								context.write?.(text);
							}
						: undefined,
			});
			context.signal.throwIfAborted();
			if (format === 'json') context.stdout(JSON.stringify(result, null, 2));
			else if (format === 'jsonl')
				context.stdout(JSON.stringify({ text: result.text, model: result.model, usage: result.usage }));
			else if (format === 'md' || format === 'markdown')
				context.stdout(
					renderTerminalMarkdown(result.text, {
						color: context.host.term?.stdoutIsTTY ?? false,
						width: context.columns,
					}),
				);
			else if (wrote) context.write?.('\n');
			else context.stdout(result.text);
		},
	};
}
