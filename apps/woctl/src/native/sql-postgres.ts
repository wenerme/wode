import type { SQLExecutionResult, SqlAdapter, SqlCallOptions } from '@wener/common/service/sql';
import type { Pool, PoolClient, QueryResult } from 'pg';

function normalizePostgresSubquery(statement: string): string {
	let value = statement.trim();
	value = value.replace(/^(?:(?:\/\*[\s\S]*?\*\/)|(?:--[^\r\n]*(?:\r?\n|$)))\s*/gu, '');
	value = value.replace(/;\s*(?:(?:\/\*[\s\S]*?\*\/)|(?:--[^\r\n]*(?:\r?\n|$)))?\s*$/gu, '');
	if (/--[^\r\n]*$/u.test(value)) value += '\n';
	return value;
}

export async function createPostgresAdapter(options: {
	connectionString: string;
	ssl?: boolean;
	timeoutMs: number;
	connectTimeoutMs: number;
	pool?: Pick<Pool, 'connect' | 'end'>;
}): Promise<SqlAdapter> {
	const pool =
		options.pool ??
		new (await import('pg')).Pool({
			connectionString: options.connectionString,
			ssl: options.ssl,
			max: 2,
			connectionTimeoutMillis: options.connectTimeoutMs,
			statement_timeout: options.timeoutMs,
		});
	if ('on' in pool && typeof pool.on === 'function') pool.on('error', () => undefined);
	let closed = false;
	let closing: Promise<void> | undefined;
	const active = new Set<() => void>();
	async function run<T>(action: (client: PoolClient) => Promise<T>, callOptions: SqlCallOptions = {}): Promise<T> {
		callOptions.signal?.throwIfAborted();
		if (closed) throw new Error('SQL connection is closed');
		const timeoutMs = callOptions.timeoutMs ?? options.timeoutMs;
		let client: PoolClient | undefined;
		let expired = false;
		let released = false;
		let rejectCancellation!: (reason: unknown) => void;
		const cancellation = new Promise<never>((_, reject) => {
			rejectCancellation = reject;
		});
		const release = (discard = false) => {
			if (client && !released) {
				released = true;
				client.release(discard);
			}
		};
		const cancel = (reason: unknown) => {
			expired = true;
			release(true);
			rejectCancellation(reason);
		};
		const abort = () => cancel(callOptions.signal?.reason ?? new Error('SQL request aborted'));
		const shutdown = () => cancel(new Error('SQL connection is closed'));
		const timer = setTimeout(() => cancel(new DOMException('SQL request timed out', 'TimeoutError')), timeoutMs);
		callOptions.signal?.addEventListener('abort', abort, { once: true });
		active.add(shutdown);
		const operation = pool.connect().then(async (connection) => {
			client = connection;
			if (expired) {
				release(true);
				throw new Error('SQL request cancelled');
			}
			try {
				return await action(connection);
			} catch (error) {
				release(true);
				throw error;
			} finally {
				release();
			}
		});
		try {
			return await Promise.race([operation, cancellation]);
		} finally {
			clearTimeout(timer);
			callOptions.signal?.removeEventListener('abort', abort);
			active.delete(shutdown);
		}
	}
	async function read<T>(action: (client: PoolClient) => Promise<T>, callOptions?: SqlCallOptions): Promise<T> {
		return run(async (client) => {
			await client.query('BEGIN READ ONLY');
			try {
				const result = await action(client);
				await client.query('COMMIT');
				return result;
			} catch (error) {
				await client.query('ROLLBACK').catch(() => undefined);
				throw error;
			}
		}, callOptions);
	}
	function result(value: QueryResult<Record<string, unknown>>, start: number): SQLExecutionResult {
		if (Array.isArray(value)) throw new Error('Multiple SQL statements are unsupported');
		return {
			columns: value.fields.map((field) => field.name),
			rows: value.rows,
			durationMs: performance.now() - start,
			affectedRows: value.rowCount ?? undefined,
		};
	}
	return {
		dialect: 'postgres',
		async ping(callOptions) {
			const start = performance.now();
			const response = await read((client) => client.query('SELECT version() AS version'), callOptions);
			return {
				ok: true,
				durationMs: performance.now() - start,
				version: response.rows[0]?.version as string | undefined,
			};
		},
		async query(input, callOptions) {
			const start = performance.now();
			const offset = input.offset ?? 0;
			const limit = input.limit ?? 100;
			const params = input.params ? [...input.params] : [];
			const statement = normalizePostgresSubquery(input.statement);
			const first = /^([a-z]+)/iu.exec(statement)?.[1]?.toLowerCase();
			const paged = first === 'select' || first === 'with';
			const query = paged
				? `SELECT * FROM (${statement}) AS __wode_query LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
				: statement;
			const response = result(
				await read((client) => client.query(query, paged ? [...params, limit, offset] : params), callOptions),
				start,
			);
			return { ...response, rows: paged ? response.rows : response.rows.slice(offset, offset + limit) };
		},
		async exec(input, callOptions) {
			const start = performance.now();
			return result(
				await run((client) => client.query(input.statement, input.params ? [...input.params] : []), callOptions),
				start,
			);
		},
		async listObject(input = {}, callOptions) {
			const response = await read(
				(client) =>
					client.query(
						"SELECT table_name AS name, table_schema AS schema, table_type AS type FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') AND ($1::text IS NULL OR table_schema = $1) AND ($2::text IS NULL OR table_name ILIKE $2) ORDER BY table_schema, table_name LIMIT $3 OFFSET $4",
						[
							input.parent?.schema ?? null,
							input.search ? `%${input.search}%` : null,
							input.limit ?? 100,
							input.offset ?? 0,
						],
					),
				callOptions,
			);
			return response.rows.map((item) => ({
				name: String(item.name),
				schema: String(item.schema),
				type: item.type === 'VIEW' ? 'view' : 'table',
			}));
		},
		async describeObject(input, callOptions) {
			const schema = input.object.schema ?? 'public';
			const response = await read(
				(client) =>
					client.query(
						'SELECT column_name, data_type, is_nullable, column_default, ordinal_position FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position',
						[schema, input.object.name],
					),
				callOptions,
			);
			if (!response.rows.length) throw new Error('SQL object not found');
			return {
				object: { name: input.object.name, schema, type: 'table' },
				children: response.rows.map((item) => ({
					name: String(item.column_name),
					type: 'column',
					attributes: {
						dataType: item.data_type,
						nullable: item.is_nullable === 'YES',
						defaultValue: item.column_default,
						ordinal: item.ordinal_position,
					},
				})),
			};
		},
		close() {
			if (closing) return closing;
			closed = true;
			for (const cancel of active) cancel();
			closing = pool.end();
			return closing;
		},
	};
}
