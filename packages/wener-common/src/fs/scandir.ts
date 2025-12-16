import pathe from 'pathe';
import type { IFileStat } from './IFileSystem';

export type ScandirOptions = {
	readdir: (path: string) => Promise<IFileStat[]>;
	path: string;
	signal?: AbortSignal;
	cursor?: string;
	depth?: number;
	limit?: number;
	strategy?: 'depth' | 'breadth';
	filter?: (file: IFileStat) => boolean;
};

export async function* scandir(options: ScandirOptions): AsyncGenerator<IFileStat> {
	const { readdir, path: startPath, signal, depth = 1, limit, strategy = 'depth', filter = () => true } = options;
	let cursor = options.cursor;
	if (cursor && !cursor.startsWith('/')) {
		cursor = pathe.join(startPath, cursor);
	}
	if (cursor && !cursor.startsWith(startPath)) {
		throw new Error(`Cursor path "${cursor}" is not within the start path "${startPath}"`);
	}

	if (signal?.aborted) return;

	// Collection to manage which directories to visit next.
	// For 'depth'-first, it acts as a Stack (LIFO).
	// For 'breadth'-first, it acts as a Queue (FIFO).
	const collection: { path: string; level: number }[] = [{ path: startPath, level: 1 }];

	let yielded = 0;
	let cursorFound = !cursor; // If no cursor is provided, we can start yielding immediately.

	while (collection.length > 0) {
		if (signal?.aborted) return;
		if (limit && yielded >= limit) return;

		// Get the next directory to process based on the strategy.
		const { path: currentPath, level: currentLevel } =
			strategy === 'depth'
				? collection.pop()! // LIFO for depth-first
				: collection.shift()!; // FIFO for breadth-first

		let entries: IFileStat[];
		try {
			entries = await readdir(currentPath);
		} catch (error) {
			// Could not read directory, skip it. You might want to log this error.
			console.warn(`scandir: Could not read directory ${currentPath}`, error);
			continue;
		}

		for (const file of entries) {
			if (signal?.aborted) return;

			if (!cursorFound) {
				if (file.path === cursor) {
					cursorFound = true;
				}
				continue;
			}

			if (filter(file)) {
				yield file;
				yielded++;
				if (limit && yielded >= limit) return;
			}

			if (file.kind === 'directory' && currentLevel < depth) {
				collection.push({ path: file.path, level: currentLevel + 1 });
			}
		}
	}
}
