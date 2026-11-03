import { type ChildProcess, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { SqlAdapter, SqlAdapterFactory, SqlCallOptions } from '@wener/common/service/sql';
import { SQLITE_PROCESS_SOURCE } from './sqlite-process-source';

function timeout(value: unknown, fallback = 30_000): number {
	if (value === undefined) return fallback;
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > 3_600_000)
		throw new TypeError('Invalid SQL timeout');
	return value;
}

export const createNativeSqlDriver: SqlAdapterFactory = async ({ config }) => {
	const options = config.options ?? {};
	const allowed = ['dialect', 'filename', 'timeoutMs', 'connectTimeoutMs', 'maxRowLimit', 'ssl'];
	if (Object.keys(options).some((key) => !allowed.includes(key))) throw new TypeError('Invalid SQL configuration');
	const dialect =
		options.dialect ??
		(config.provider === 'sql'
			? options.filename !== undefined || config.baseUrl?.startsWith('file:') || config.baseUrl?.startsWith('sqlite:')
				? 'sqlite'
				: 'postgres'
			: config.provider);
	const timeoutMs = timeout(options.timeoutMs);
	const connectTimeoutMs = timeout(options.connectTimeoutMs, 10_000);
	if (dialect === 'sqlite') {
		let filename = options.filename;
		if (filename === undefined && config.baseUrl?.startsWith('file:')) filename = fileURLToPath(config.baseUrl);
		if (filename === undefined && config.baseUrl?.startsWith('sqlite:'))
			filename = config.baseUrl.slice('sqlite:'.length);
		if (filename === undefined) filename = ':memory:';
		if (typeof filename !== 'string' || !filename || filename.includes('\0'))
			throw new TypeError('Invalid SQLite filename');
		return createSqliteAdapter({ filename, readOnly: config.readOnly, timeoutMs, busyTimeoutMs: connectTimeoutMs });
	}
	if (!['postgres', 'postgresql', 'pg'].includes(String(dialect))) throw new TypeError('Unsupported SQL dialect');
	if (!config.baseUrl || !['postgres:', 'postgresql:'].includes(new URL(config.baseUrl).protocol))
		throw new TypeError('PostgreSQL requires a connection URL');
	if (options.ssl !== undefined && typeof options.ssl !== 'boolean')
		throw new TypeError('Invalid SQL TLS configuration');
	const { createPostgresAdapter } = await import('./sql-postgres');
	return createPostgresAdapter({
		connectionString: config.baseUrl,
		ssl: options.ssl as boolean | undefined,
		timeoutMs,
		connectTimeoutMs,
	});
};

export function createSqliteAdapter(options: {
	filename: string;
	readOnly: boolean;
	timeoutMs: number;
	busyTimeoutMs: number;
}): SqlAdapter {
	let worker: ChildProcess | undefined;
	let closed = false;
	let closePromise: Promise<void> | undefined;
	let sequence = 0;
	const pending = new Map<number, { resolve(value: unknown): void; reject(error: unknown): void; cleanup(): void }>();
	function stop(error: unknown): Promise<void> {
		closed = true;
		for (const call of pending.values()) {
			call.cleanup();
			call.reject(error);
		}
		pending.clear();
		closePromise ??=
			!worker || worker.exitCode !== null || worker.signalCode !== null
				? Promise.resolve()
				: new Promise<void>((resolve) => {
						worker!.once('close', () => resolve());
						worker!.kill('SIGKILL');
					});
		return closePromise;
	}
	function run<T>(method: string, input: unknown, callOptions: SqlCallOptions = {}): Promise<T> {
		callOptions.signal?.throwIfAborted();
		if (closed) return Promise.reject(new Error('SQL connection is closed'));
		const timeoutMs = timeout(callOptions.timeoutMs, options.timeoutMs);
		if (!worker) {
			worker = spawn(process.execPath, ['-e', SQLITE_PROCESS_SOURCE], {
				stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
				serialization: 'advanced',
			});
			worker.stderr?.resume();
			worker.send({ method: 'initialize', input: options });
			worker.on('message', ({ id, result, error }: { id: number; result: T; error?: string }) => {
				const call = pending.get(id);
				if (!call) return;
				pending.delete(id);
				call.cleanup();
				if (error) call.reject(new Error('SQL request failed'));
				else call.resolve(result);
			});
			worker.on('error', () => {
				void stop(new Error('SQL connection failed'));
			});
			worker.on('exit', () => {
				void stop(new Error('SQL connection is closed'));
			});
		}
		return new Promise<T>((resolve, reject) => {
			const id = ++sequence;
			const abort = () => {
				void stop(callOptions.signal?.reason ?? new Error('SQL request aborted'));
			};
			const timer = setTimeout(() => {
				void stop(new DOMException('SQL request timed out', 'TimeoutError'));
			}, timeoutMs);
			pending.set(id, {
				resolve: (value) => resolve(value as T),
				reject,
				cleanup: () => {
					clearTimeout(timer);
					callOptions.signal?.removeEventListener('abort', abort);
				},
			});
			callOptions.signal?.addEventListener('abort', abort, { once: true });
			try {
				worker!.send({ id, method, input }, (error) => {
					if (error) void stop(new Error('SQL connection failed'));
				});
			} catch {
				void stop(new Error('Invalid SQL input'));
			}
		});
	}
	return {
		dialect: 'sqlite',
		ping: (options) => run('ping', {}, options),
		query: (input, options) => run('query', input, options),
		exec: (input, options) => run('exec', input, options),
		listObject: (input = {}, options) => run('listObject', input, options),
		describeObject: (input, options) => run('describeObject', input, options),
		close: () => stop(new Error('SQL connection is closed')),
	};
}
