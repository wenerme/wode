import { type CliOptions, CliUsageError } from '@wener/common/cli';
import type { PromptRequest } from 'common/ai/prompt';
import { type PromptPreset, parsePromptTemplate, renderPromptTemplate } from 'common/context';
import { optionStrings, readCommandText } from '../command-utils';
import type { WocliExecution } from '../createWocliCli';

export async function promptVariables(options: CliOptions, context: WocliExecution): Promise<Record<string, unknown>> {
	const input: Record<string, unknown> = Object.create(null);
	for (const item of [...optionStrings(options, 'var'), ...optionStrings(options, 'input')]) {
		const equals = item.indexOf('=');
		if (equals < 1) throw new CliUsageError('Prompt variables must use name=value');
		const key = item.slice(0, equals);
		const text = await readCommandText(item.slice(equals + 1), context);
		try {
			input[key] = JSON.parse(text);
		} catch {
			input[key] = text;
		}
	}
	return input;
}

export async function getPromptPreset(
	name: string,
	presets: Readonly<Record<string, PromptPreset>>,
	context: WocliExecution,
): Promise<PromptPreset> {
	const key = name.replace(/^@/, '');
	if (Object.hasOwn(presets, key)) return presets[key];
	return parsePromptTemplate(await readCommandText(name.startsWith('@') || name === '-' ? name : `@${name}`, context));
}

/** 先解析模板角色，再插入变量，变量中的角色标记只作为内容保留。 */
export function presetMessages(preset: PromptPreset, variables: Record<string, unknown>): PromptRequest['messages'] {
	const messages: PromptRequest['messages'] = [];
	const roles = /\{\{\s*role\s+["'](system|user|assistant)["']\s*\}\}/gu;
	let role = 'user';
	let cursor = 0;
	for (const match of preset.template.matchAll(roles)) {
		const body = preset.template.slice(cursor, match.index).trim();
		if (body)
			messages.push({
				role,
				content: [{ type: 'text', text: renderPromptTemplate({ ...preset, template: body }, variables).template }],
			});
		role = match[1];
		cursor = match.index + match[0].length;
	}
	const body = preset.template.slice(cursor).trim();
	if (body)
		messages.push({
			role,
			content: [{ type: 'text', text: renderPromptTemplate({ ...preset, template: body }, variables).template }],
		});
	return messages;
}
