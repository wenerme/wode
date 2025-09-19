export interface KeyValueStorage {
	set(key: string, value: any): Promise<void>;

	get(key: string): Promise<any | null>;

	delete(key: string): Promise<void>;

	clear(): Promise<void>;

	iterator(): AsyncIterableIterator<[string, any]>;
}
