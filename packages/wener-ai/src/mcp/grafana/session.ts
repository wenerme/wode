type ProxySessionState<TClient = unknown> = {
	lastActivityAt: number;
	clients: Map<string, TClient>;
};

export class GrafanaSessionManager<TClient = unknown> {
	readonly #sessions = new Map<string, ProxySessionState<TClient>>();
	readonly #ttlMs: number;
	readonly #timer?: ReturnType<typeof setInterval>;

	constructor(ttlMs = 30 * 60 * 1000) {
		this.#ttlMs = ttlMs;
		if (ttlMs > 0) {
			this.#timer = setInterval(() => this.reap(), Math.max(1_000, ttlMs / 2));
		}
	}

	getOrCreate(sessionId: string) {
		let state = this.#sessions.get(sessionId);
		if (!state) {
			state = {
				lastActivityAt: Date.now(),
				clients: new Map(),
			};
			this.#sessions.set(sessionId, state);
		}
		state.lastActivityAt = Date.now();
		return state;
	}

	reap() {
		if (this.#ttlMs <= 0) return;
		const cutoff = Date.now() - this.#ttlMs;
		for (const [sessionId, state] of this.#sessions.entries()) {
			if (state.lastActivityAt < cutoff) {
				this.#sessions.delete(sessionId);
			}
		}
	}

	close() {
		if (this.#timer) clearInterval(this.#timer);
		this.#sessions.clear();
	}
}
