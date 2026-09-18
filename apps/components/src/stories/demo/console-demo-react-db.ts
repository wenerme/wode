import { type CollectionConfig, createCollection, deepEquals } from '@tanstack/react-db';
import { liveQuery } from 'dexie';
import {
	ConsoleDemoDatabase,
	type ConsoleDemoPartition,
	type ContactRecord,
	type CustomerRecord,
	deleteContacts,
	deleteCustomers,
	listContacts,
	listCustomers,
	prepareConsoleDemoDatabase,
	putContacts,
	putCustomers,
	resetConsoleDemoPartition,
} from './console-demo-database';

type MutationTransaction<T extends { id: string }> = {
	mutations: Array<{ key: string; modified: T }>;
};

export type CreateConsoleDemoDataRuntimeOptions = {
	databaseName?: string;
	onSyncError?: (error: unknown) => void;
	partition: ConsoleDemoPartition;
	readContacts?: typeof listContacts;
	readCustomers?: typeof listCustomers;
	reset?: boolean;
	runtimeId?: string;
};

export async function createConsoleDemoDataRuntime({
	databaseName,
	onSyncError = console.error,
	partition,
	readContacts = listContacts,
	readCustomers = listCustomers,
	reset,
	runtimeId = crypto.randomUUID(),
}: CreateConsoleDemoDataRuntimeOptions) {
	const database = new ConsoleDemoDatabase(databaseName);
	try {
		await prepareConsoleDemoDatabase(database, partition, { reset });
	} catch (error) {
		database.close();
		throw error;
	}
	const collectionScope = `${database.name}-${partition}-${runtimeId}`;
	let refreshContacts: () => Promise<void> = async () => undefined;

	const customers = createDexieCollection<CustomerRecord>({
		id: `console-demo-${collectionScope}-customer`,
		read: () => readCustomers(database, partition),
		onSyncError,
		persistInsert: (records) => putCustomers(database, partition, records),
		persistUpdate: (records) => putCustomers(database, partition, records),
		persistDelete: async (ids) => {
			await deleteCustomers(database, partition, ids);
			await refreshContacts().catch(onSyncError);
		},
	});

	const contacts = createDexieCollection<ContactRecord>({
		id: `console-demo-${collectionScope}-contact`,
		read: () => readContacts(database, partition),
		onSyncError,
		persistInsert: (records) => putContacts(database, partition, records),
		persistUpdate: (records) => putContacts(database, partition, records),
		persistDelete: (ids) => deleteContacts(database, partition, ids),
	});
	refreshContacts = contacts.refresh;
	let disposed = false;
	const dispose = async () => {
		if (disposed) return;
		disposed = true;
		try {
			await Promise.all([
				Promise.resolve().then(() => customers.collection.cleanup()),
				Promise.resolve().then(() => contacts.collection.cleanup()),
			]);
		} finally {
			database.close();
		}
	};
	const preloads = [customers.collection.preload(), contacts.collection.preload()];
	try {
		await Promise.all([customers.initialSync, contacts.initialSync, ...preloads]);
	} catch (error) {
		await dispose().catch(onSyncError);
		throw error;
	}

	return {
		contacts: contacts.collection,
		customers: customers.collection,
		database,
		partition,
		dispose,
		async reset() {
			await resetConsoleDemoPartition(database, partition);
			await Promise.all([customers.refresh(), contacts.refresh()]);
		},
	};
}

export type ConsoleDemoDataRuntime = Awaited<ReturnType<typeof createConsoleDemoDataRuntime>>;

type CreateDexieCollectionOptions<T extends { id: string }> = {
	id: string;
	onSyncError: (error: unknown) => void;
	persistDelete: (ids: readonly string[]) => Promise<void>;
	persistInsert: (records: readonly T[]) => Promise<void>;
	persistUpdate: (records: readonly T[]) => Promise<void>;
	read: () => Promise<T[]>;
};

function createDexieCollection<T extends { id: string }>({
	id,
	onSyncError,
	persistDelete,
	persistInsert,
	persistUpdate,
	read,
}: CreateDexieCollectionOptions<T>) {
	let refresh = async (): Promise<void> => {
		throw new Error(`${id} sync has not started`);
	};
	let initialSyncSettled = false;
	let resolveInitialSync!: () => void;
	let rejectInitialSync!: (error: unknown) => void;
	const initialSync = new Promise<void>((resolve, reject) => {
		resolveInitialSync = resolve;
		rejectInitialSync = reject;
	});

	const config: CollectionConfig<T, string> = {
		id,
		gcTime: 60_000,
		getKey: (record) => record.id,
		startSync: true,
		sync: {
			rowUpdateMode: 'full',
			sync: ({ begin, write, commit, markReady }) => {
				let stopped = false;
				let ready = false;
				let previous = new Map<string, T>();
				let serial = Promise.resolve();
				const settleInitialSync = (error?: unknown) => {
					if (initialSyncSettled) return;
					initialSyncSettled = true;
					if (error === undefined) resolveInitialSync();
					else rejectInitialSync(error);
				};
				const reportSyncError = (error: unknown) => {
					if (!ready) {
						ready = true;
						markReady();
					}
					settleInitialSync(error);
					onSyncError(error);
				};

				const reconcile = async () => {
					const records = await read();
					if (stopped) return;
					const next = new Map(records.map((record) => [record.id, record]));
					begin();
					for (const [key, record] of previous) {
						if (!next.has(key)) write({ type: 'delete', value: record });
					}
					for (const [key, record] of next) {
						const old = previous.get(key);
						if (!old) write({ type: 'insert', value: record });
						else if (!deepEquals(old, record)) write({ type: 'update', value: record });
					}
					commit();
					previous = next;
					if (!ready) {
						ready = true;
						markReady();
						settleInitialSync();
					}
				};

				refresh = () => {
					const run = serial.then(reconcile);
					serial = run.catch(() => undefined);
					return run;
				};

				const subscription = liveQuery(read).subscribe({
					next: () => void refresh().catch(reportSyncError),
					error: reportSyncError,
				});
				return () => {
					stopped = true;
					subscription.unsubscribe();
				};
			},
		},
		onInsert: async ({ transaction }) => {
			await persistInsert(getModified(transaction as MutationTransaction<T>));
			await refresh().catch(onSyncError);
		},
		onUpdate: async ({ transaction }) => {
			await persistUpdate(getModified(transaction as MutationTransaction<T>));
			await refresh().catch(onSyncError);
		},
		onDelete: async ({ transaction }) => {
			await persistDelete(transaction.mutations.map((mutation) => String(mutation.key)));
			await refresh().catch(onSyncError);
		},
	};

	return { collection: createCollection(config), initialSync, refresh: () => refresh() };
}

function getModified<T extends { id: string }>(transaction: MutationTransaction<T>) {
	return transaction.mutations.map((mutation) => mutation.modified);
}
