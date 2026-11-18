import type { z } from 'zod';
import { serviceCliString, serviceCliStrings, type ServiceCliInputContext, type ServiceCliOptions } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';

export function requireYes(options: ServiceCliOptions): void {
	if (options.yes !== true) throw new ServiceCliInputError('Telegram write operation requires --yes');
}

export function required(options: ServiceCliOptions, name: string): string {
	const value = serviceCliString(options, name);
	if (!value?.trim()) throw new ServiceCliInputError(`--${name} is required`);
	return value;
}

export function argument(args: readonly string[], index: number, label: string): string {
	const value = args[index];
	if (!value?.trim()) throw new ServiceCliInputError(`${label} is required`);
	return value;
}

export function integer(options: ServiceCliOptions, name: string, min = 1, max = Number.MAX_SAFE_INTEGER): number | undefined {
	const value = serviceCliString(options, name);
	if (value === undefined) return undefined;
	if (!/^-?\d+$/u.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max)
		throw new ServiceCliInputError(`--${name} must be an integer between ${min} and ${max}`);
	return Number(value);
}

export function requiredInteger(options: ServiceCliOptions, name: string): number {
	required(options, name);
	return integer(options, name)!;
}

export function chatId(options: ServiceCliOptions, name = 'chat'): string | number {
	const value = required(options, name);
	if (!/^-?\d+$/u.test(value)) return value;
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed)) throw new ServiceCliInputError(`--${name} is outside the safe integer range`);
	return parsed;
}

export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
	const parsed = schema.safeParse(input);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		throw new ServiceCliInputError(`Invalid Telegram input${issue?.path.length ? `: ${issue.path.join('.')}` : ''}`);
	}
	return parsed.data;
}

export async function textInput(context: ServiceCliInputContext, name = 'text'): Promise<string> {
	const value = await context.readText(required(context.options, name), { label: `Telegram ${name}`, maxBytes: 64 * 1024 });
	if (!value.trim()) throw new ServiceCliInputError(`--${name} must not be empty`);
	return value;
}

export async function jsonInput(context: ServiceCliInputContext, name: string): Promise<unknown> {
	const text = await context.readText(required(context.options, name), { label: `Telegram ${name}`, maxBytes: 1024 * 1024 });
	try { return JSON.parse(text); }
	catch { throw new ServiceCliInputError(`--${name} must contain valid JSON`); }
}

export function allowedUpdates(options: ServiceCliOptions): string[] | undefined {
	return serviceCliStrings(options, 'allowed-update');
}

/** Generic API parameters stay inline; file/stdin input is handled by the typed commands. */
export function apiParams(options: ServiceCliOptions): Record<string, unknown> {
	const result: Record<string, unknown> = Object.create(null);
	for (const entry of serviceCliStrings(options, 'params') ?? []) {
		const at = entry.indexOf('=');
		const key = entry.slice(0, at);
		if (at < 1 || !/^[A-Za-z_][A-Za-z0-9_]*$/u.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key))
			throw new ServiceCliInputError('--params expects key=value with a valid parameter name');
		if (Object.hasOwn(result, key)) throw new ServiceCliInputError('Duplicate --params key');
		const raw = entry.slice(at + 1);
		if (raw.startsWith('json:')) {
			try { result[key] = JSON.parse(raw.slice(5)); }
			catch { throw new ServiceCliInputError('--params json: value must contain valid JSON'); }
		} else result[key] = raw;
	}
	return result;
}
