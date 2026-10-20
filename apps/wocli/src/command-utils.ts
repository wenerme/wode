import { type CliContext, type CliOptions, CliUsageError, renderCliOutput } from '@wener/common/cli';
import { getCliOutputOptions } from '@wener/common/cli/getCliOutputOptions';
import type { CliConfig } from 'common/context';
import type { WocliExecution } from './createWocliCli';

export function setConfigEntry<T>(record: Record<string, T>, key: string, value: T): void {
	Object.defineProperty(record, key, { value, enumerable: true, configurable: true, writable: true });
}

export function optionString(options: CliOptions, key: string): string | undefined {
	const value = options[key];
	if (value !== undefined && typeof value !== 'string') throw new CliUsageError(`--${key} requires one value`);
	return value;
}
export function optionStrings(options: CliOptions, key: string): string[] {
	const value = options[key];
	if (value === undefined) return [];
	if (typeof value === 'string') return [value];
	if (Array.isArray(value)) return value;
	throw new CliUsageError(`--${key} requires values`);
}
export function optionNumber(
	options: CliOptions,
	key: string,
	constraints: { min?: number; max?: number; integer?: boolean } = {},
): number | undefined {
	const value = optionString(options, key);
	if (value === undefined) return undefined;
	const number = Number(value);
	if (
		!value.trim() ||
		!Number.isFinite(number) ||
		(constraints.integer && !Number.isSafeInteger(number)) ||
		number < (constraints.min ?? -Infinity) ||
		number > (constraints.max ?? Infinity)
	)
		throw new CliUsageError(`Invalid --${key}`);
	return number;
}
export function writeCommandOutput(value: unknown, options: CliOptions, context: CliContext): void {
	context.signal.throwIfAborted();
	context.stdout(renderCliOutput(value, getCliOutputOptions(context, options)));
}
export async function readCommandText(
	value: string,
	context: WocliExecution,
	limits?: { maxBytes?: number },
): Promise<string> {
	context.signal.throwIfAborted();
	const maxBytes = Math.min(limits?.maxBytes ?? 16 * 1024 * 1024, 16 * 1024 * 1024);
	let result = value;
	if (value.startsWith('@') || value === '-') {
		if (!context.host.readText) throw new CliUsageError('Host does not support file or stdin input');
		result = await context.host.readText(value, { signal: context.signal, maxBytes });
	}
	context.signal.throwIfAborted();
	if (new TextEncoder().encode(result).byteLength > maxBytes) throw new CliUsageError('Input exceeds size limit');
	return result;
}
export async function loadCommandContext(context: WocliExecution, options: CliOptions) {
	context.signal.throwIfAborted();
	return context.getConfigContext(options);
}
export async function changeCommandConfig(
	context: WocliExecution,
	options: CliOptions,
	edit: (config: CliConfig, contextName: string) => void,
): Promise<void> {
	context.signal.throwIfAborted();
	const config = await context.host.config.load({ context: optionString(options, 'context') });
	const selected = context.getConfigContext(options);
	edit(config, selected.name);
	context.signal.throwIfAborted();
	await context.host.config.save(config);
	writeCommandOutput({ saved: true }, options, context);
}
