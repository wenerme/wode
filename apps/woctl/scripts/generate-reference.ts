import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { renderCliCatalog } from '../src/catalog';
import { createCli } from '../src/createCli';
import { createNativeHost } from '../src/native';

const mode = process.argv[2];
if ((mode !== '--write' && mode !== '--check') || process.argv.length !== 3) {
	throw new Error('Usage: generate-reference.ts --write|--check');
}
const target = new URL('../../../docs/woctl/reference.md', import.meta.url);
// Construct the native command graph; catalog() never loads this configuration path.
const cli = createCli(createNativeHost({ config: fileURLToPath(new URL('./unused-catalog.yaml', import.meta.url)) }));
const reference = '<!-- Generated from registered metadata. Run: node --import tsx apps/woctl/scripts/generate-reference.ts --write -->\n\n'
	+ renderCliCatalog(cli.catalog(), { format: 'md' });
if (mode === '--write') {
	await writeFile(target, reference, 'utf8');
	console.log('Updated docs/woctl/reference.md');
} else {
	const previous = await readFile(target, 'utf8').catch((error: NodeJS.ErrnoException) => {
		if (error.code === 'ENOENT') return undefined;
		throw error;
	});
	if (previous !== reference) throw new Error('Registered CLI reference is outdated; run generate-reference.ts --write');
	console.log('Registered CLI reference is up to date');
}
