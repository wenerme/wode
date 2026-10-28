import {
	type MessageGenerationOptions,
	type MessageGenerationRequest,
	type MessageGenerationResult,
	prepareMessageGenerationRequest,
	redactMessageGenerationRequest,
} from '@wener/client/ai/message-generation';
import { MessageGenerationModelService, ModelRegistry } from '@wener/common/ai/model/registry';
import { type CliCommand, CliUsageError } from '@wener/common/cli';
import { type AiProtocol, resolveAiModel } from 'common/ai';
import { parsePromptTemplate, renderPromptTemplate } from 'common/context';
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
	{ name: 'var', description: 'Template variable name=value or name=@file; repeatable', repeatable: true },
	{ name: 'input', description: 'Template variable name=value; repeatable', repeatable: true },
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
		description: 'Generate text with a model in the current context, with templates and request previews',
		output: 'custom',
		arguments: '[text...]',
		options: [
			{ name: 'model', aliases: ['m'], description: 'Model alias or provider/model' },
			{ name: 'provider', description: 'Select an AI provider' },
			{ name: 'protocol', description: 'Override protocol: openai/openai-response/anthropic/gemini' },
			{ name: 'prompt', aliases: ['p'], description: 'Additional prompt, @file or -; repeatable', repeatable: true },
			{ name: 'system', aliases: ['s'], description: 'System prompt or @file' },
			{ name: 'message', description: 'Additional role:content message; repeatable', repeatable: true },
			{ name: 'temperature', description: 'Sampling temperature, 0..2' },
			{ name: 'top-p', description: 'Top-p sampling, 0..1' },
			{ name: 'max-output-tokens', description: 'Output token limit (must be explicitly configured for Anthropic)' },
			{ name: 'output', aliases: ['o'], description: 'text | json (complete result) | jsonl | markdown' },
			{ name: 'json', type: 'boolean', description: 'Request a JSON object from the model' },
			{ name: 'jsonschema', description: 'Required JSON Schema: JSON or @file' },
			{ name: 'dump', type: 'boolean', description: 'Show the request with credentials hidden without network access' },
			{ name: 'stream', type: 'boolean', negatable: true, description: 'Stream generation over SSE; Node supports incremental output' },
			...variableOptions,
		],
		commands: [
			{
				name: 'list',
				aliases: ['ls'],
				description: 'List prompt presets in the current context',
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
				description: 'Show a prompt preset; --json outputs the complete configuration',
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
				description: 'Import YAML frontmatter and template content from .prompt.md',
				options: [{ name: 'text', description: 'Import template text directly' }],
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
				description: 'Remove a prompt preset defined in the current context',
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
				description: 'Render a template with variables without calling a model',
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
			const messages: MessageGenerationRequest['messages'] = [];
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
			const request: MessageGenerationRequest = {
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
				context.stdout(
					JSON.stringify(redactMessageGenerationRequest(prepareMessageGenerationRequest(request)), null, 2),
				);
				return;
			}
			let wrote = false;
			const generate = context.host.generate;
			const streamCapability = request.stream ? 'message-streaming' : 'message-generation';
			const legacyMessageModel = target.config.capabilities === undefined && target.provider.capabilities === undefined;
			const supportsCapability =
				target.capabilities.includes(streamCapability) ||
				(request.stream && legacyMessageModel && target.capabilities.includes('message-generation'));
			if (!supportsCapability) throw new CliUsageError(`Selected AI model does not support ${streamCapability}`);
			const registry = new ModelRegistry();
			registry.register({
				provider: target.providerName,
				id: target.model,
				alias: target.name.slice(target.providerName.length + 1),
				capabilities: [streamCapability],
				service: new MessageGenerationModelService({
					model: target.model,
					target: target.target,
					generate: generate ? (request, options = {}) => generate(request, options) : undefined,
				}),
			});
			const model = registry.require({ model: target.name, capability: streamCapability });
			const { target: _target, model: _model, stream: _stream, ...input } = request;
			const executionOptions: MessageGenerationOptions = {
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
			};
			let result: MessageGenerationResult;
			if (request.stream) {
				let completed: MessageGenerationResult | undefined;
				for await (const part of model.service.streamContent(input, executionOptions)) {
					if (part.type === 'finish') completed = part.result;
				}
				if (!completed) throw new Error('Prompt stream ended before completion');
				result = completed;
			} else result = await model.service.generateContent(input, executionOptions);
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
