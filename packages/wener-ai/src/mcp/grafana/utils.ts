export function parseRelativeDuration(input: string) {
	const normalized = input.trim();
	if (!normalized) return 0;

	const pattern = /(\d+(?:\.\d+)?)(ns|us|µs|ms|s|m|h|d|w)/g;
	let total = 0;
	let matched = false;
	for (const match of normalized.matchAll(pattern)) {
		matched = true;
		const value = Number.parseFloat(match[1]);
		switch (match[2]) {
			case 'ns':
				total += value / 1_000_000;
				break;
			case 'us':
			case 'µs':
				total += value / 1_000;
				break;
			case 'ms':
				total += value;
				break;
			case 's':
				total += value * 1_000;
				break;
			case 'm':
				total += value * 60_000;
				break;
			case 'h':
				total += value * 3_600_000;
				break;
			case 'd':
				total += value * 86_400_000;
				break;
			case 'w':
				total += value * 604_800_000;
				break;
		}
	}
	if (!matched) {
		throw new Error(`Unsupported relative duration: ${input}`);
	}
	return total;
}

export function parseGrafanaTime(value: string | undefined | null, now = new Date()) {
	if (!value || value === 'now') return now;
	if (/^\d+$/.test(value)) {
		return new Date(Number.parseInt(value, 10));
	}
	if (value.startsWith('now-')) {
		return new Date(now.getTime() - parseRelativeDuration(value.slice(4)));
	}
	if (value.startsWith('now+')) {
		return new Date(now.getTime() + parseRelativeDuration(value.slice(4)));
	}
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new Error(`Invalid time value: ${value}`);
	}
	return parsed;
}

export function resolveTimeRange(input: { from?: string | null; to?: string | null }, fallbackMs = 3_600_000) {
	const to = parseGrafanaTime(input.to ?? 'now');
	const from = parseGrafanaTime(input.from ?? `now-${Math.floor(fallbackMs / 3_600_000)}h`, to);
	if (from.getTime() > to.getTime()) {
		throw new Error('Time range start must not be after end');
	}
	return {
		from,
		to,
		fromMs: from.getTime(),
		toMs: to.getTime(),
		fromIso: from.toISOString(),
		toIso: to.toISOString(),
	};
}

export function compact<T>(items: Array<T | null | undefined>): T[] {
	return items.filter((item): item is T => item != null);
}

export function ensureArray<T>(value: T | T[] | undefined | null): T[] {
	if (value == null) return [];
	return Array.isArray(value) ? value : [value];
}

export function toRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
	return value as Record<string, unknown>;
}

export function pickFirstString(...values: unknown[]) {
	for (const value of values) {
		if (typeof value === 'string' && value) return value;
	}
	return undefined;
}

export function getByPath(root: unknown, path: string) {
	const normalized = path.replace(/^\$\./, '').replace(/^\$/, '');
	if (!normalized) return root;
	const segments = normalized.split('.').flatMap((segment) => {
		const matches = segment.matchAll(/([^[\]]+)|\[(\d+|\*)\]/g);
		return Array.from(matches, (match) => match[1] ?? match[2]);
	});

	let current: unknown[] = [root];
	for (const segment of segments) {
		const next: unknown[] = [];
		for (const value of current) {
			if (segment === '*') {
				if (Array.isArray(value)) next.push(...value);
				continue;
			}
			if (/^\d+$/.test(segment)) {
				if (Array.isArray(value)) next.push(value[Number.parseInt(segment, 10)]);
				continue;
			}
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				next.push((value as Record<string, unknown>)[segment]);
			}
		}
		current = next;
	}
	return current.length <= 1 ? current[0] : current;
}

export function setByPath(root: Record<string, unknown>, path: string, value: unknown) {
	const normalized = path.replace(/^\$\./, '').replace(/^\$/, '');
	const rawSegments = normalized.split('.');
	if (!normalized || rawSegments.length === 0) {
		throw new Error('JSON path is required');
	}

	let current: Record<string, unknown> | unknown[] = root;
	for (let i = 0; i < rawSegments.length - 1; i += 1) {
		const segment = rawSegments[i]!;
		const arrayMatch = /^([^[\]]+)\[(\d+)\]$/.exec(segment);
		if (arrayMatch) {
			const [, key, indexText] = arrayMatch;
			const index = Number.parseInt(indexText, 10);
			const list = Array.isArray((current as Record<string, unknown>)[key])
				? ((current as Record<string, unknown>)[key] as unknown[])
				: [];
			while (list.length <= index) list.push({});
			(current as Record<string, unknown>)[key] = list;
			current = toRecord(list[index]);
			list[index] = current;
			continue;
		}
		const object = current as Record<string, unknown>;
		object[segment] = toRecord(object[segment]);
		current = object[segment] as Record<string, unknown>;
	}

	const last = rawSegments.at(-1)!;
	const appendMatch = /^([^[\]]+)\/-$/.exec(last);
	if (appendMatch) {
		const [, key] = appendMatch;
		const list = Array.isArray((current as Record<string, unknown>)[key])
			? ((current as Record<string, unknown>)[key] as unknown[])
			: [];
		list.push(value);
		(current as Record<string, unknown>)[key] = list;
		return;
	}

	const arrayMatch = /^([^[\]]+)\[(\d+)\]$/.exec(last);
	if (arrayMatch) {
		const [, key, indexText] = arrayMatch;
		const index = Number.parseInt(indexText, 10);
		const list = Array.isArray((current as Record<string, unknown>)[key])
			? ((current as Record<string, unknown>)[key] as unknown[])
			: [];
		while (list.length <= index) list.push(null);
		list[index] = value;
		(current as Record<string, unknown>)[key] = list;
		return;
	}

	(current as Record<string, unknown>)[last] = value;
}

export function removeByPath(root: Record<string, unknown>, path: string) {
	const normalized = path.replace(/^\$\./, '').replace(/^\$/, '');
	const rawSegments = normalized.split('.');
	if (!normalized || rawSegments.length === 0) {
		throw new Error('JSON path is required');
	}

	let current: Record<string, unknown> | unknown[] = root;
	for (let i = 0; i < rawSegments.length - 1; i += 1) {
		const segment = rawSegments[i]!;
		const arrayMatch = /^([^[\]]+)\[(\d+)\]$/.exec(segment);
		if (arrayMatch) {
			const [, key, indexText] = arrayMatch;
			const index = Number.parseInt(indexText, 10);
			const list = (current as Record<string, unknown>)[key];
			if (!Array.isArray(list) || !list[index] || typeof list[index] !== 'object') return;
			current = list[index] as Record<string, unknown>;
			continue;
		}
		const next = (current as Record<string, unknown>)[segment];
		if (!next || typeof next !== 'object') return;
		current = next as Record<string, unknown>;
	}

	const last = rawSegments.at(-1)!;
	const arrayMatch = /^([^[\]]+)\[(\d+)\]$/.exec(last);
	if (arrayMatch) {
		const [, key, indexText] = arrayMatch;
		const index = Number.parseInt(indexText, 10);
		const list = (current as Record<string, unknown>)[key];
		if (Array.isArray(list)) {
			list.splice(index, 1);
		}
		return;
	}

	delete (current as Record<string, unknown>)[last];
}
