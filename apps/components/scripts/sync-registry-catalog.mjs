import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(appRoot, 'public', 'r', 'registry.json');
const destination = join(appRoot, 'src', 'generated', 'registry-catalog.json');

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
