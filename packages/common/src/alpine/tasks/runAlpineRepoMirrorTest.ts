import { createAlpineMirror, type AlpineMirror } from '../AlpineMirror';

export async function runAlpineRepoMirrorTest({
	repo = createAlpineMirror(),
	timeout = 30 * 1000,
}: {
	repo?: AlpineMirror;
	timeout?: number;
} = {}) {
	let mirrors = await repo.getMirrors();
	const ac = new AbortController();
	setTimeout(() => {
		ac.abort();
	}, timeout);

	type Result = {
		url: string;
		lastUpdated: number;
		latency: number;
		staleness: number; // time since last updated
		ok: boolean;
	};
	let items: Array<Result> = [];

	await Promise.race([
		new Promise((resolve) => {
			ac.signal.addEventListener('abort', resolve, { once: true });
		}),
		Promise.allSettled(
			mirrors.map(async (url) => {
				let start = Date.now();
				const res = await fetch(`${url}/last-updated`, {
					signal: ac.signal,
				});
				let r = {
					url,
					lastUpdated: 0,
					latency: Date.now() - start,
					staleness: 0,
					ok: res.ok,
				};
				if (res.ok) {
					const ts = +(await res.text());
					r.lastUpdated = ts;
				}
				items.push(r);
			}),
		),
	]);

	let ok = items.filter((v) => v.ok);
	const max = Math.max(...ok.map((i) => i.lastUpdated));
	ok.forEach((item) => {
		item.staleness = max - item.lastUpdated;
	});

	return items;
}
