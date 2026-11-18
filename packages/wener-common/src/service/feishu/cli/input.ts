import type { z } from 'zod';
import {
	type ServiceCliInputContext,
	type ServiceCliOptions,
	serviceCliString,
} from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';

/** Write commands confirm before reading input, resolving credentials or sending HTTP. */
export function feishuRequireYes(options: ServiceCliOptions, message: string): void {
	if (options.yes !== true) throw new ServiceCliInputError(message);
}

/** Error messages carry only the field path and the schema message, never the input value. */
export function feishuParseInput<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
	const result = schema.safeParse(value);
	if (result.success) return result.data;
	const issue = result.error.issues[0];
	throw new ServiceCliInputError(`Invalid ${issue?.path.join('.') || 'input'}: ${issue?.message ?? 'invalid value'}`);
}

export function feishuInteger(options: ServiceCliOptions, name: string, min: number, max: number): number | undefined {
	const value = serviceCliString(options, name);
	if (value === undefined) return undefined;
	const parsed = Number(value);
	if (!value.trim() || !Number.isSafeInteger(parsed) || parsed < min || parsed > max)
		throw new ServiceCliInputError(`--${name} must be an integer between ${min} and ${max}`);
	return parsed;
}

export function feishuChoice<T extends string>(options: ServiceCliOptions, name: string, mapping: Record<string, T>): T | undefined {
	const value = serviceCliString(options, name);
	if (value === undefined) return undefined;
	if (!Object.hasOwn(mapping, value)) throw new ServiceCliInputError(`--${name} must be one of ${Object.keys(mapping).join(', ')}`);
	return mapping[value];
}

export function feishuPageInput(options: ServiceCliOptions, maxPageSize: number) {
	return {
		pageSize: feishuInteger(options, 'page-size', 1, maxPageSize),
		pageToken: serviceCliString(options, 'page-token'),
	};
}

export async function feishuReadText(context: ServiceCliInputContext, value: string, label: string, maxBytes = 64 * 1024): Promise<string> {
	const text = (await context.readText(value, { label, maxBytes })).trim();
	if (!text) throw new ServiceCliInputError(`${label} must not be empty`);
	return text;
}

/** `-` reads stdin, `@path` and a bare path read a file through the host's binary port. */
export function feishuFileSource(value: string): string {
	if (value === '-' || value.startsWith('@')) return value;
	return `@${value}`;
}

export function feishuBaseName(source: string): string | undefined {
	if (source === '-') return undefined;
	const name = source.replace(/^@/u, '').split(/[\\/]/u).pop()?.trim();
	return name || undefined;
}

export const FEISHU_ID_TYPES = { open_id: 'open_id', union_id: 'union_id', user_id: 'user_id' } as const;
