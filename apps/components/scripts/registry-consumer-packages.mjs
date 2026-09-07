import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function resolveLocalPackageDependency({ name, path, selectors }) {
	const manifestPath = join(path, 'package.json');
	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
	return validateLocalPackageDependency({ manifest, manifestPath, name, path, selectors });
}

export function validateLocalPackageDependency({ manifest, manifestPath, name, path, selectors }) {
	if (manifest?.name !== name) {
		throw new Error(
			`Local package identity mismatch: expected ${name}, found ${manifest?.name ?? '<missing>'} in ${manifestPath}`,
		);
	}
	const version = parseVersion(manifest.version);
	if (!version) {
		throw new Error(
			`Local package has invalid version: ${name} -> ${manifest?.version ?? '<missing>'} in ${manifestPath}`,
		);
	}
	for (const selector of selectors) {
		const parsed = parsePackageSpec(selector);
		if (parsed.name !== name) throw new Error(`Local package selector identity mismatch: ${name} -> ${selector}`);
		if (parsed.range && !matchesSupportedRange(version, parsed.range)) {
			throw new Error(`Local package selector mismatch: ${selector} does not accept ${name}@${manifest.version}`);
		}
	}
	return { path, version: manifest.version };
}

export function packageNameFromSpec(specifier) {
	return parsePackageSpec(specifier).name;
}

function parsePackageSpec(specifier) {
	const separator = specifier.startsWith('@') ? specifier.indexOf('@', 1) : specifier.indexOf('@');
	if (separator === -1) return { name: specifier, range: undefined };
	return { name: specifier.slice(0, separator), range: specifier.slice(separator + 1) || undefined };
}

function matchesSupportedRange(version, range) {
	if (range.startsWith('^')) {
		const minimum = parseVersion(range.slice(1));
		if (!minimum) throw new Error(`Unsupported local package selector: ${range}`);
		const upper =
			minimum.major > 0
				? [minimum.major + 1, 0, 0]
				: minimum.minor > 0
					? [0, minimum.minor + 1, 0]
					: [0, 0, minimum.patch + 1];
		return compareVersion(version, minimum) >= 0 && compareVersion(version, toVersion(upper)) < 0;
	}
	const exact = parseVersion(range);
	if (!exact) throw new Error(`Unsupported local package selector: ${range}`);
	return compareVersion(version, exact) === 0;
}

function parseVersion(value) {
	if (typeof value !== 'string') return undefined;
	const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value);
	return match ? toVersion(match.slice(1).map(Number)) : undefined;
}

function toVersion([major, minor, patch]) {
	return { major, minor, patch };
}

function compareVersion(left, right) {
	return left.major - right.major || left.minor - right.minor || left.patch - right.patch;
}
