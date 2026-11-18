import { parse as parseYaml } from 'yaml';
import { type ServiceCliInputContext, serviceCliString, serviceCliStrings } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { SQLQueryInput } from '../types';

export const SQLQueryFileMaxBytes = 1024 * 1024;
const invalid = () => new ServiceCliInputError('Invalid SQL input');

export function parseSQLInteger(value: unknown, label: 'limit' | 'offset'): number | undefined {
	if (value === undefined) return undefined;
	const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
	if (!Number.isSafeInteger(parsed) || parsed < 0 || (label === 'limit' && parsed === 0)) {
		throw new ServiceCliInputError(
			label === 'limit' ? 'limit must be a positive safe integer' : 'offset must be a non-negative safe integer',
		);
	}
	return parsed;
}

export function parseSQLQueryFile(path: string, content: string): SQLQueryInput {
	const ext = /\.[^./\\]+$/u.exec(path)?.[0]?.toLowerCase();
	if (ext === '.sql' || path === '-') return { statement: content };
	if (ext !== '.json' && ext !== '.yaml' && ext !== '.yml') {
		throw new ServiceCliInputError('Unsupported SQL file extension');
	}
	try {
		const value: unknown = ext === '.json' ? JSON.parse(content) : parseYaml(content);
		if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
		const file = value as Record<string, unknown>;
		const statement = file.statement ?? file.query;
		if (typeof statement !== 'string' || !statement.trim()) throw invalid();
		if (file.params !== undefined && !Array.isArray(file.params)) throw invalid();
		return {
			statement,
			params: file.params as unknown[] | undefined,
			limit: parseSQLInteger(file.limit, 'limit'),
			offset: parseSQLInteger(file.offset, 'offset'),
		};
	} catch {
		throw new ServiceCliInputError('Invalid SQL query file');
	}
}

async function readSQLText(context: ServiceCliInputContext, value: string): Promise<string> {
	try {
		const text = await context.readText(value, { label: 'SQL input', maxBytes: SQLQueryFileMaxBytes });
		if (new TextEncoder().encode(text).byteLength > SQLQueryFileMaxBytes) throw invalid();
		return text;
	} catch {
		throw new ServiceCliInputError('Unable to read SQL input within 1 MiB');
	}
}

/** Values are always bound parameters; SQL text is never interpolated. */
export async function prepareSQLStatement(context: ServiceCliInputContext): Promise<SQLQueryInput> {
	const argument = context.args.join(' ').trim();
	if (!argument) throw new ServiceCliInputError('SQL statement is required');
	let input: SQLQueryInput = { statement: argument };
	if (argument.startsWith('@') || argument === '-') {
		if (argument === '@') throw new ServiceCliInputError('SQL file path is required');
		input = parseSQLQueryFile(argument === '-' ? '-' : argument.slice(1), await readSQLText(context, argument));
	}
	if (!input.statement.trim()) throw new ServiceCliInputError('SQL statement is required');
	if (new TextEncoder().encode(input.statement).byteLength > SQLQueryFileMaxBytes) throw invalid();
	const rawParams = serviceCliString(context.options, 'params');
	let params = input.params ? [...input.params] : undefined;
	if (rawParams !== undefined) {
		const text = rawParams.startsWith('@') ? await readSQLText(context, rawParams) : rawParams;
		try {
			if (new TextEncoder().encode(text).byteLength > SQLQueryFileMaxBytes) throw invalid();
			const parsed: unknown = JSON.parse(text);
			if (!Array.isArray(parsed)) throw invalid();
			params = parsed;
		} catch {
			throw new ServiceCliInputError('SQL params must be a JSON array');
		}
	}
	for (const assignment of serviceCliStrings(context.options, 'var') ?? []) {
		const match = /^([1-9]\d*)=([\s\S]*)$/u.exec(assignment);
		const position = Number(match?.[1]);
		if (!match || !Number.isSafeInteger(position) || position > SQLQueryFileMaxBytes) {
			throw new ServiceCliInputError('SQL --var requires a positive parameter position and value');
		}
		let value: unknown = match[2];
		try {
			value = JSON.parse(match[2]!);
		} catch {
			/* Plain strings remain strings. */
		}
		params ??= [];
		while (params.length < position) params.push(null);
		params[position - 1] = value;
	}
	return {
		statement: input.statement.trim(),
		params,
		limit: parseSQLInteger(serviceCliString(context.options, 'limit') ?? input.limit, 'limit'),
		offset: parseSQLInteger(serviceCliString(context.options, 'offset') ?? input.offset, 'offset'),
	};
}
