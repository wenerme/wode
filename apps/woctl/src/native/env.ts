import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { CliConfigError } from 'common/context';
import { findProjectRootSync } from './project-config';

function parse(content: string, label: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [index, source] of content.split(/\r?\n/u).entries()) {
		const line = source.trim();
		if (!line || line.startsWith('#')) continue;
		const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u.exec(line);
		if (!match) throw new CliConfigError(`${label}: invalid environment entry at line ${index + 1}`);
		let value = match[2];
		const doubleQuoted = /^("(?:\\.|[^"\\])*")(?:\s+#.*)?$/u.exec(value);
		const singleQuoted = /^('(?:[^']*)')(?:\s+#.*)?$/u.exec(value);
		if (doubleQuoted) {
			try { value = JSON.parse(doubleQuoted[1]); } catch { throw new CliConfigError(`${label}: invalid quoted value at line ${index + 1}`); }
		} else if (singleQuoted) {
			value = singleQuoted[1].slice(1, -1);
		} else if (value.startsWith('"') || value.startsWith("'")) {
			throw new CliConfigError(`${label}: invalid quoted value at line ${index + 1}`);
		} else value = value.replace(/\s+#.*$/u, '').trim();
		result[match[1]] = value;
	}
	return result;
}

function readOptional(path: string): Record<string, string> {
	try { return parse(readFileSync(path, 'utf8'), basename(path)); }
	catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return {};
		if (error instanceof CliConfigError) throw error;
		throw new CliConfigError('Unable to read environment file');
	}
}

/** Build a native-only environment view without mutating process.env. */
export function loadNativeEnv(cwd: string, processEnv: NodeJS.ProcessEnv = process.env): Readonly<Record<string, string>> {
	const root = findProjectRootSync(cwd);
	if (!root) return Object.freeze(Object.fromEntries(Object.entries(processEnv).filter((entry): entry is [string, string] => entry[1] !== undefined)));
	const values = {
		...readOptional(join(root, '.wode', '.env')),
		...readOptional(join(root, '.env')),
		...readOptional(join(root, '.wode', '.env.local')),
		...readOptional(join(root, '.env.local')),
		...Object.fromEntries(Object.entries(processEnv).filter((entry): entry is [string, string] => entry[1] !== undefined)),
	};
	return Object.freeze(values);
}
