export async function arrayFromAsync<T>(asyncIterable: AsyncIterable<T>): Promise<T[]> {
	const array: T[] = [];
	for await (const i of asyncIterable) array.push(i);
	return array;
}
