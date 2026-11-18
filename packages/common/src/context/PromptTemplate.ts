import { parse } from 'yaml';
import { type PromptPreset, PromptPresetSchema } from './AiConfig';

/** 迁移 wcli parseDotpromptSource 的 frontmatter/body 分界，文件读取留给宿主。 */
export function parsePromptTemplate(source: string): PromptPreset {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u.exec(source);
	const frontmatter: unknown = match ? parse(match[1] || '{}') : {};
	if (frontmatter === null || typeof frontmatter !== 'object' || Array.isArray(frontmatter))
		throw new Error('Prompt frontmatter must be an object');
	const raw = frontmatter as Record<string, unknown>;
	const config = typeof raw.config === 'object' && raw.config !== null ? (raw.config as Record<string, unknown>) : {};
	return PromptPresetSchema.parse({
		title: raw.title,
		description: raw.description,
		model: raw.model ?? config.model,
		system: raw.system,
		template: match ? (match[2] ?? '') : source,
		temperature: raw.temperature ?? config.temperature,
		maxOutputTokens: raw.maxOutputTokens ?? config.maxOutputTokens ?? config.max_tokens,
		input: raw.defaults,
	});
}

/** 仅做数据插值，不执行表达式或脚本。 */
export function renderPromptTemplate(preset: PromptPreset, values: Record<string, unknown> = {}) {
	const input: Record<string, unknown> = { ...preset.input, ...values };
	const interpolate = (template: string) =>
		template.replace(/\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}\}/gu, (_match, key: string) => {
			let value: unknown = input;
			for (const part of key.split('.')) {
				if (!value || typeof value !== 'object' || !Object.hasOwn(value, part))
					throw new Error(`Missing prompt variable: ${key}`);
				value = (value as Record<string, unknown>)[part];
			}
			return typeof value === 'string' ? value : (JSON.stringify(value) ?? '');
		});
	return {
		...preset,
		template: interpolate(preset.template),
		system: preset.system ? interpolate(preset.system) : undefined,
		input,
	};
}
