import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.argv[2] || 'packages/common/src/protos';

async function* walk(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walk(path);
		} else if (entry.isFile() && path.endsWith('.ts')) {
			yield path;
		}
	}
}

for await (const path of walk(root)) {
	const content = await readFile(path, 'utf8');
	const normalized = content.replace(/\n+$/u, '\n');
	if (normalized !== content) {
		await writeFile(path, normalized);
	}
}
