/**
 * This Web Storage API interface provides access to a particular domain's session or local storage. It allows, for example, the addition, modification, or deletion of stored data items.
 *
 * @see [Storage](https://developer.mozilla.org/docs/Web/API/Storage)
 * @see localStorage
 * @see sessionStorage
 */
export interface Storage {
	readonly length: number;
	clear(): void;
	getItem(key: string): string | null;
	key(index: number): string | null;
	removeItem(key: string): void;
	setItem(key: string, value: string): void;
}
