import { assertSQLAllowed } from '../readonly';
import type { ISqlService, SQLObjectReference, SqlAdapter, SqlCallOptions } from '../types';
import { SqlMethodInputs, type SqlServiceCallOptions } from '../SqlServiceContract';

function record(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function invalid(): never {
	throw new TypeError('Invalid SQL service input');
}
function keys(value: Record<string, unknown>, allowed: string[]) {
	if (Object.keys(value).some((key) => !allowed.includes(key))) invalid();
}
function objectReference(value: unknown, required = false): asserts value is SQLObjectReference {
	if (!record(value)) invalid();
	for (const [key, item] of Object.entries(value)) {
		if (!['catalog', 'schema', 'name', 'type'].includes(key)) invalid();
		if (item === undefined) continue;
		if (typeof item !== 'string' || !item.trim() || /[\x00-\x1f\x7f]/u.test(item)) invalid();
	}
	if (required && (typeof value.name !== 'string' || !value.name.trim())) invalid();
}

export function createSqlService({
	adapter,
	readOnly = true,
	type = 'sql',
	maxRowLimit = 10_000,
}: {
	adapter: SqlAdapter;
	readOnly?: boolean;
	type?: string;
	maxRowLimit?: number;
}): ISqlService {
	if (
		!Number.isSafeInteger(maxRowLimit) ||
		maxRowLimit < 1 ||
		typeof readOnly !== 'boolean' ||
		typeof type !== 'string' ||
		!type.trim()
	)
		throw new TypeError('Invalid SQL service configuration');
	let closed = false;
	let closing: Promise<void> | undefined;
	function page(input: { limit?: number; offset?: number }) {
		const limit = input.limit === undefined ? Math.min(100, maxRowLimit) : input.limit;
		const offset = input.offset === undefined ? 0 : input.offset;
		if (
			!Number.isSafeInteger(limit) ||
			limit < 1 ||
			limit > maxRowLimit ||
			!Number.isSafeInteger(offset) ||
			offset < 0 ||
			!Number.isSafeInteger(offset + limit)
		)
			invalid();
		return { limit, offset };
	}
	function check(options?: SqlServiceCallOptions): SqlCallOptions | undefined {
		if (closed) throw new Error('SQL service is closed');
		if (options !== undefined && !record(options)) invalid();
		if (options) keys(options as Record<string, unknown>, ['signal', 'context', 'lastEventId']);
		if (options?.context !== undefined) {
			if (!record(options.context)) invalid();
			keys(options.context, ['timeoutMs']);
		}
		const timeoutMs = options?.context?.timeoutMs;
		if (
			timeoutMs !== undefined &&
			(typeof timeoutMs !== 'number' ||
				!Number.isSafeInteger(timeoutMs) ||
				timeoutMs < 1 ||
				timeoutMs > 3_600_000)
		)
			invalid();
		if (options?.signal !== undefined && !(options.signal instanceof AbortSignal)) invalid();
		if (options?.signal?.aborted) throw new DOMException('SQL operation aborted', 'AbortError');
		return options === undefined ? undefined : {
			...(options.signal === undefined ? {} : { signal: options.signal }),
			...(timeoutMs === undefined ? {} : { timeoutMs }),
		};
	}
	async function run<T>(options: SqlServiceCallOptions | undefined, operation: (native?: SqlCallOptions) => Promise<T>): Promise<T> {
		const native = check(options);
		try {
			const result = await operation(native);
			check(options);
			return result;
		} catch {
			check(options);
			throw new Error('SQL operation failed');
		}
	}
	function statement(input: unknown, readonly: boolean) {
		if (
			!record(input) ||
			typeof input.statement !== 'string' ||
			(input.params !== undefined && !Array.isArray(input.params))
		)
			invalid();
		assertSQLAllowed(input.statement, readonly, adapter.dialect);
	}
	return {
		type,
		dialect: adapter.dialect,
		readOnly,
		async query(input, options) {
			check(options);
			statement(input, true);
			keys(input as unknown as Record<string, unknown>, ['statement', 'params', 'limit', 'offset']);
			const pagination = page(input);
			return run(options, (native) =>
				adapter.query({ statement: input.statement, params: input.params, ...pagination }, native),
			);
		},
		async exec(input, options) {
			check(options);
			statement(input, readOnly);
			keys(input as unknown as Record<string, unknown>, ['statement', 'params']);
			return run(options, (native) => adapter.exec({ statement: input.statement, params: input.params }, native));
		},
		async ping(input, options) {
			check(options);
			if (!SqlMethodInputs.ping.safeParse(input).success) invalid();
			return run(options, (native) => adapter.ping(native));
		},
		async listObject(input = {}, options) {
			check(options);
			if (!record(input)) invalid();
			keys(input, ['parent', 'search', 'limit', 'offset']);
			if (input.parent !== undefined) objectReference(input.parent);
			if (input.search !== undefined && (typeof input.search !== 'string' || /[\x00-\x1f\x7f]/u.test(input.search)))
				invalid();
			const pagination = page(input);
			return run(options, (native) => adapter.listObject({ ...input, ...pagination }, native));
		},
		async describeObject(input, options) {
			check(options);
			if (!record(input)) invalid();
			keys(input, ['object']);
			objectReference(input.object, true);
			return run(options, (native) => adapter.describeObject(input, native));
		},
		close() {
			if (!closing) {
				closed = true;
				closing = Promise.resolve()
					.then(() => adapter.close())
					.then(
						() => undefined,
						() => {
							throw new Error('SQL close failed');
						},
					);
			}
			return closing;
		},
		async [Symbol.asyncDispose]() {
			await this.close();
		},
	};
}
