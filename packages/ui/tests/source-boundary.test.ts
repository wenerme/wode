import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = path.resolve(import.meta.dirname, '../src');

describe('@wener/ui source boundary', () => {
	it('contains only neutral package identifiers', () => {
		const source = collectText(sourceRoot);
		expect(source).not.toMatch(/novita|jiekou|ppio/i);
	});
});

function collectText(directory: string): string {
	return fs
		.readdirSync(directory, { withFileTypes: true })
		.map((entry) => {
			const entryPath = path.join(directory, entry.name);
			return entry.isDirectory() ? collectText(entryPath) : fs.readFileSync(entryPath, 'utf8');
		})
		.join('\n');
}
