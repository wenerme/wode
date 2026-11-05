import type { z } from 'zod/v4';
import {
	type ServiceCliInputContext,
	type ServiceCliOptions,
	serviceCliString,
	serviceCliStrings,
} from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';

export function linearParseInput<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
	const result = schema.safeParse(value);
	if (result.success) return result.data;
	const issue = result.error.issues[0];
	throw new ServiceCliInputError(`Invalid ${issue?.path.join('.') || 'input'}: ${issue?.message ?? 'invalid value'}`);
}

export function linearRequiredOption(options: ServiceCliOptions, name: string): string {
	const value = serviceCliString(options, name)?.trim();
	if (!value) throw new ServiceCliInputError(`--${name} is required`);
	return value;
}

export function linearRequireMutation(options: ServiceCliOptions): void {
	if (options.yes !== true) throw new ServiceCliInputError('Linear mutation requires --yes');
}

export function linearInteger(options: ServiceCliOptions, name: string, min: number, max: number) {
	const value = serviceCliString(options, name);
	if (value === undefined) return undefined;
	const parsed = Number(value);
	if (!value.trim() || !Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
		throw new ServiceCliInputError(`--${name} must be between ${min} and ${max}`);
	}
	return parsed;
}

export function linearPageInput(options: ServiceCliOptions) {
	return {
		first: linearInteger(options, 'limit', 1, 100) ?? 50,
		after: serviceCliString(options, 'after'),
		includeArchived: options['include-archived'] === true,
	};
}

export function linearIssueFields(options: ServiceCliOptions) {
	return {
		stateId: serviceCliString(options, 'state'),
		assigneeId: serviceCliString(options, 'assignee'),
		projectId: serviceCliString(options, 'project'),
		priority: linearInteger(options, 'priority', 0, 4),
		dueDate: serviceCliString(options, 'due-date'),
		labelIds: serviceCliStrings(options, 'label'),
	};
}

export function linearAssertClearOptions(options: ServiceCliOptions): void {
	for (const name of ['assignee', 'project', 'due-date']) {
		if (options[`clear-${name}`] && options[name] !== undefined) {
			throw new ServiceCliInputError(`--clear-${name} cannot be combined with --${name}`);
		}
	}
}

export async function linearReadText(context: ServiceCliInputContext, value: string, label: string): Promise<string> {
	const maxBytes = 100_000;
	const content = await context.readText(value, { maxBytes, label });
	// Embedded hosts must enforce the same bound even for in-memory input.
	if (new TextEncoder().encode(content).byteLength > maxBytes) {
		throw new ServiceCliInputError(`${label} exceeds ${maxBytes} bytes`);
	}
	const text = content.trim();
	if (!text) throw new ServiceCliInputError(`${label} must not be empty`);
	return text;
}

export async function linearDescription(context: ServiceCliInputContext): Promise<string | undefined> {
	const value = serviceCliString(context.options, 'description');
	return value === undefined ? undefined : linearReadText(context, value, 'Linear issue description');
}
