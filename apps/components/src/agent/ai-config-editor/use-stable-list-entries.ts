'use client';

import { useLayoutEffect, useState } from 'react';

export type StableListEntry<T> = { item: T; key: string };

export function useStableListEntries<T>(items: readonly T[], prefix = 'item'): StableListEntry<T>[] {
	const [committed, setCommitted] = useState<StableListState<T>>(() =>
		projectStableList(emptyStableList(prefix), items, prefix),
	);
	const projected = projectStableList(committed, items, prefix);
	useLayoutEffect(() => {
		setCommitted((current) =>
			sameStableList(current, items, prefix) ? current : projectStableList(current, items, prefix),
		);
	}, [items, prefix]);
	return items.map((item, index) => ({ item, key: projected.keys[index] }));
}

type StableListState<T> = {
	items: readonly T[];
	keys: readonly string[];
	prefix: string;
	sequence: number;
};

function emptyStableList<T>(prefix: string): StableListState<T> {
	return { items: [], keys: [], prefix, sequence: 0 };
}

function projectStableList<T>(previous: StableListState<T>, items: readonly T[], prefix: string): StableListState<T> {
	const keys: Array<string | undefined> = new Array(items.length);
	const usedPrevious = new Set<number>();
	let sequence = previous.sequence;

	for (const [index, item] of items.entries()) {
		const previousIndex = previous.items.findIndex(
			(candidate, candidateIndex) => !usedPrevious.has(candidateIndex) && Object.is(candidate, item),
		);
		if (previousIndex < 0) continue;
		keys[index] = previous.keys[previousIndex];
		usedPrevious.add(previousIndex);
	}

	for (const index of items.keys()) {
		if (keys[index]) continue;
		if (index < previous.keys.length && !usedPrevious.has(index)) {
			keys[index] = previous.keys[index];
			usedPrevious.add(index);
		} else {
			keys[index] = `${prefix}-${++sequence}`;
		}
	}

	return { items: [...items], keys: keys as string[], prefix, sequence };
}

function sameStableList<T>(state: StableListState<T>, items: readonly T[], prefix: string) {
	return (
		state.prefix === prefix &&
		state.items.length === items.length &&
		state.items.every((item, index) => Object.is(item, items[index]))
	);
}
