/**
 * Find workspace/project root by searching upward for marker files
 */

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

export interface FindUpOptions {
	/** Starting directory (default: process.cwd()) */
	cwd?: string;
	/** Stop searching when reaching home directory (default: true) */
	stopAtHome?: boolean;
	/** Stop searching when finding .git directory (default: true) */
	stopAtGit?: boolean;
	/** Custom stop condition - return true to stop searching */
	stopWhen?: (dir: string) => boolean;
}

/**
 * Find a file by searching upward from cwd
 * Stops at .git directory, home directory, or filesystem root
 */
export function findUpSync(filename: string, options: FindUpOptions = {}): string | null {
	const { cwd = process.cwd(), stopAtHome = true, stopAtGit = true, stopWhen } = options;
	const home = homedir();
	let current = resolve(cwd);

	while (current) {
		const filePath = join(current, filename);
		if (existsSync(filePath)) {
			return filePath;
		}

		// Check custom stop condition
		if (stopWhen?.(current)) {
			return null;
		}

		// Stop at .git directory
		if (stopAtGit) {
			const gitPath = join(current, '.git');
			if (existsSync(gitPath)) {
				return null;
			}
		}

		// Stop at home directory
		if (stopAtHome && current === home) {
			return null;
		}

		const parent = dirname(current);
		if (parent === current) {
			// Reached filesystem root
			return null;
		}
		current = parent;
	}

	return null;
}

/**
 * Find workspace root by searching for common marker files
 * Returns the directory containing the marker file
 */
export function findWorkspaceRoot(options: FindUpOptions = {}): string | null {
	const { cwd = process.cwd(), stopAtHome = true, stopAtGit = false } = options;
	const home = homedir();
	let current = resolve(cwd);

	// Workspace markers in priority order
	const markers = [
		'pnpm-workspace.yaml',
		'lerna.json',
		'nx.json',
		'rush.json',
		'package.json', // Only if it has workspaces field
		'.git',
	];

	while (current) {
		// Check for workspace markers
		for (const marker of markers) {
			const markerPath = join(current, marker);
			if (existsSync(markerPath)) {
				// For package.json, check if it has workspaces
				if (marker === 'package.json') {
					try {
						const pkg = require(markerPath);
						if (pkg.workspaces) {
							return current;
						}
					} catch {
						// Ignore parse errors
					}
					continue;
				}
				return current;
			}
		}

		// Stop at home directory
		if (stopAtHome && current === home) {
			return null;
		}

		// Stop at .git if requested (for finding project root within workspace)
		if (stopAtGit) {
			const gitPath = join(current, '.git');
			if (existsSync(gitPath)) {
				return current;
			}
		}

		const parent = dirname(current);
		if (parent === current) {
			return null;
		}
		current = parent;
	}

	return null;
}

/**
 * Find git root by searching upward for .git directory
 */
export function findGitRoot(cwd: string = process.cwd()): string | null {
	const home = homedir();
	let current = resolve(cwd);

	while (current) {
		const gitPath = join(current, '.git');
		if (existsSync(gitPath)) {
			return current;
		}

		if (current === home) {
			return null;
		}

		const parent = dirname(current);
		if (parent === current) {
			return null;
		}
		current = parent;
	}

	return null;
}
