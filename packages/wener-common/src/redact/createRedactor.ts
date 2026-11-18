import { createPolicy } from './policy';
import type { RedactionOptions, Redactor, RedactorOptions } from './types';
import { runRedaction } from './walk';

/** Creates an isolated policy snapshot; arrays and regex state are not shared with the caller. */
export function createRedactor(options: RedactorOptions = {}): Redactor {
	const policy = createPolicy(options);
	return Object.freeze({
		redact<T>(value: T): T {
			return runRedaction(value, policy).value as T;
		},
		isSensitive(value: unknown, key?: string): boolean {
			return runRedaction(value, policy, key).sensitive;
		},
	});
}

/** Stateless structured/text helper, including the legacy explicit bypass and key hint. */
export function redactValue<T>(value: T, options: RedactionOptions = {}): T {
	if (options.redact === false) return value;
	return runRedaction(value, createPolicy(options), options.key).value as T;
}

export function redactText(value: string, options: RedactionOptions = {}): string {
	return redactValue(value, options);
}

/** Line-oriented diagnostics. Uses the default policy plus explicit additions, independently of the global singleton. */
export function redactMessage(value: string, options: RedactionOptions = {}): string {
	if (options.redact === false) return value;
	return runRedaction(value, createPolicy(options), options.key, true).value as string;
}
