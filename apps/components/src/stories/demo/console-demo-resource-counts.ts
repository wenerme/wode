import { liveQuery } from 'dexie';

export type ConsoleDemoResourceCounts = {
	account: number;
	contact: number;
};

export function subscribeConsoleDemoResourceCounts({
	onCounts,
	onError,
	read,
}: {
	onCounts: (counts: ConsoleDemoResourceCounts) => void;
	onError: (error: unknown) => void;
	read: () => Promise<ConsoleDemoResourceCounts>;
}) {
	const subscription = liveQuery(read).subscribe(onCounts, onError);
	return () => subscription.unsubscribe();
}
