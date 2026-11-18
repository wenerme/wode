import { canonicalRdata } from './rdata';

/** Opaque offset cursor for providers that page locally (`o:<offset>`). */
export function pageLocally<T>(items: T[], input: { cursor?: string; limit?: number } | undefined): { items: T[]; nextCursor?: string } {
	let offset = 0;
	if (input?.cursor !== undefined) {
		const match = /^o:(\d{1,9})$/u.exec(input.cursor);
		if (!match) throw new TypeError('Invalid DNS cursor');
		offset = Number(match[1]);
	}
	if (input?.limit === undefined) return { items: items.slice(offset) };
	const end = offset + input.limit;
	return { items: items.slice(offset, end), ...(end < items.length ? { nextCursor: `o:${end}` } : {}) };
}

/**
 * Opaque page-number cursor for providers with server-side pages: `p:<page>:<size>` (1-based).
 * The page size is part of the cursor so that changing `limit` cannot skip or repeat items.
 */
export function parsePageCursor(cursor: string | undefined, expectedSize?: number): { page: number; size?: number } {
	if (cursor === undefined) return { page: 1, ...(expectedSize === undefined ? {} : { size: expectedSize }) };
	const match = /^p:([1-9]\d{0,8}):([1-9]\d{0,5})$/u.exec(cursor);
	if (!match) throw new TypeError('Invalid DNS cursor');
	const size = Number(match[2]);
	if (expectedSize !== undefined && size !== expectedSize) throw new TypeError('DNS cursor was issued for a different limit');
	return { page: Number(match[1]), size };
}

export function formatPageCursor(page: number, size: number): string {
	return `p:${page}:${size}`;
}

export interface DnsRecordChangePlan<R> {
	/** Existing records already matching value and TTL. */
	keep: R[];
	/** Existing records rewritten in place (value and/or TTL), preserving record ids. */
	update: { record: R; value: string }[];
	create: string[];
	delete: R[];
}

/**
 * Diffs supplier records of one RRSet against the desired presentation values. Matching uses
 * {@link canonicalRdata}; unmatched existing records are reused for unmatched values (in-place
 * update) before anything is created or deleted, which avoids CNAME/singleton conflicts.
 */
export function planDnsRecordChanges<R>(input: {
	type: string;
	ttl: number;
	values: string[];
	existing: { record: R; value: string; ttl: number }[];
}): DnsRecordChangePlan<R> {
	const wanted: string[] = [];
	const seen = new Set<string>();
	for (const value of input.values) {
		const key = canonicalRdata(input.type, value);
		if (seen.has(key)) continue;
		seen.add(key);
		wanted.push(value);
	}
	const plan: DnsRecordChangePlan<R> = { keep: [], update: [], create: [], delete: [] };
	const unused = [...input.existing];
	const pending: string[] = [];
	for (const value of wanted) {
		const key = canonicalRdata(input.type, value);
		const index = unused.findIndex((item) => canonicalRdata(input.type, item.value) === key);
		if (index < 0) {
			pending.push(value);
			continue;
		}
		const [match] = unused.splice(index, 1);
		if (match!.ttl === input.ttl) plan.keep.push(match!.record);
		else plan.update.push({ record: match!.record, value });
	}
	for (const value of pending) {
		const reuse = unused.shift();
		if (reuse) plan.update.push({ record: reuse.record, value });
		else plan.create.push(value);
	}
	plan.delete.push(...unused.map((item) => item.record));
	return plan;
}

export interface DnsOperationState {
	mapAbortError?: (error: DnsDeadlineError) => Error;
}

export class DnsDeadlineError extends Error {
	readonly code: 'TIMEOUT' | 'ABORTED' | 'CLOSED';
	constructor(code: 'TIMEOUT' | 'ABORTED' | 'CLOSED') {
		super(code === 'TIMEOUT' ? 'DNS operation timed out' : code === 'CLOSED' ? 'DNS service is closed' : 'DNS operation was aborted');
		this.name = 'DnsDeadlineError';
		this.code = code;
	}
}

/**
 * Tracks in-flight operations of one service: each operation gets one deadline covering
 * credential resolution and every request it sends; `close()` aborts all of them.
 */
export class DnsOperationScope {
	readonly #active = new Set<AbortController>();
	readonly #defaultTimeoutMs: number;
	#closed = false;

	constructor(defaultTimeoutMs: number) {
		this.#defaultTimeoutMs = defaultTimeoutMs;
	}

	get closed(): boolean {
		return this.#closed;
	}

	/**
	 * Runs `fn` under one deadline. When the deadline, `close()` or the caller's signal stops the
	 * operation, `state.mapAbortError` (if set by `fn`) may wrap the stop error, for example to
	 * report partially applied changes that are tracked outside the race.
	 */
	async run<T>(
		options: { signal?: AbortSignal; context?: { timeoutMs?: number } } | undefined,
		fn: (signal: AbortSignal, state: DnsOperationState) => Promise<T>,
	): Promise<T> {
		if (this.#closed) throw new DnsDeadlineError('CLOSED');
		if (options?.signal?.aborted) throw new DnsDeadlineError('ABORTED');
		const requested = options?.context?.timeoutMs;
		const timeoutMs = requested !== undefined && Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, this.#defaultTimeoutMs) : this.#defaultTimeoutMs;
		const controller = new AbortController();
		const state: DnsOperationState = {};
		let rejectAbort!: (error: DnsDeadlineError) => void;
		const aborted = new Promise<never>((_, reject) => {
			rejectAbort = reject;
		});
		void aborted.catch(() => undefined);
		const stop = (code: DnsDeadlineError['code']) => {
			if (controller.signal.aborted) return;
			const error = new DnsDeadlineError(code);
			controller.abort(error);
			rejectAbort(error);
		};
		const onAbort = () => stop('ABORTED');
		options?.signal?.addEventListener('abort', onAbort, { once: true });
		const timer = setTimeout(() => stop('TIMEOUT'), timeoutMs);
		const entry = Object.assign(controller, { stopClosed: () => stop('CLOSED') });
		this.#active.add(entry);
		try {
			return await Promise.race([fn(controller.signal, state), aborted]);
		} catch (error) {
			const reason = controller.signal.reason;
			if (reason instanceof DnsDeadlineError) throw state.mapAbortError?.(reason) ?? reason;
			throw error;
		} finally {
			clearTimeout(timer);
			options?.signal?.removeEventListener('abort', onAbort);
			this.#active.delete(entry);
		}
	}

	close(): void {
		this.#closed = true;
		for (const entry of [...this.#active]) (entry as AbortController & { stopClosed(): void }).stopClosed();
		this.#active.clear();
	}
}
