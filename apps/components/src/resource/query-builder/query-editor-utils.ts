import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { QueryFieldKind, QueryJsonPrimitive, QueryJsonValue } from './query-model';

export function queryOptionKey(option: { label: string; value: QueryJsonPrimitive }) {
	return `${queryValueKey(option.value)}:${option.label}`;
}

export function queryValueKey(value: QueryJsonValue): string {
	if (value === null) return 'null';
	if (Array.isArray(value)) return `array:${value.map(queryValueKey).join('|')}`;
	if (typeof value === 'number') {
		if (Object.is(value, -0)) return 'number:-0';
		if (Number.isNaN(value)) return 'number:NaN';
	}
	if (typeof value === 'object') {
		return `object:${Object.keys(value)
			.sort()
			.map((key) => `${key}:${queryValueKey(value[key])}`)
			.join('|')}`;
	}
	return `${typeof value}:${String(value)}`;
}

export function withOccurrenceKeys<T>(items: readonly T[], getIdentity: (item: T) => string) {
	const occurrences = new Map<string, number>();
	return items.map((item) => {
		const identity = getIdentity(item);
		const occurrence = occurrences.get(identity) ?? 0;
		occurrences.set(identity, occurrence + 1);
		return { item, key: `${identity}:${occurrence}` };
	});
}

export function focusFirstOption(event: ReactKeyboardEvent<HTMLInputElement>, container: HTMLDivElement | null) {
	if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
	event.preventDefault();
	const options = [
		...(container?.querySelectorAll<HTMLButtonElement>('button[data-query-option]:not(:disabled)') ?? []),
	];
	const target = event.key === 'ArrowUp' || event.key === 'End' ? options.at(-1) : options[0];
	target?.focus();
}

export function focusAdjacentOption(event: ReactKeyboardEvent<HTMLButtonElement>) {
	if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
	const container = event.currentTarget.closest<HTMLElement>('[data-query-options]');
	const options = [
		...(container?.querySelectorAll<HTMLButtonElement>('button[data-query-option]:not(:disabled)') ?? []),
	];
	const current = options.indexOf(event.currentTarget);
	if (current < 0 || options.length === 0) return;
	event.preventDefault();
	const target =
		event.key === 'Home'
			? 0
			: event.key === 'End'
				? options.length - 1
				: (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
	options[target]?.focus();
}

export function inputType(kind: QueryFieldKind) {
	if (kind === 'number' || kind === 'integer') return 'number';
	if (kind === 'date') return 'date';
	if (kind === 'datetime') return 'datetime-local';
	return 'text';
}

export function parseScalar(value: string, kind: QueryFieldKind): QueryJsonPrimitive {
	if (!value.trim()) return null;
	if (kind === 'number' || kind === 'integer') {
		const parsed = Number(value);
		return Number.isFinite(parsed) && (kind !== 'integer' || Number.isInteger(parsed)) ? parsed : null;
	}
	if (kind === 'boolean') return value === 'true' ? true : value === 'false' ? false : null;
	if (kind === 'datetime') {
		const parsed = new Date(value);
		return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
	}
	return value;
}

export function formatEditorValue(value: QueryJsonValue, kind: QueryFieldKind) {
	if (kind !== 'datetime' || typeof value !== 'string') return formatScalar(value);
	const parsed = new Date(value);
	if (!Number.isFinite(parsed.getTime())) return '';
	const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 19);
}

export function formatScalar(value: QueryJsonValue) {
	return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
