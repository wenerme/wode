import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = resolve(appRoot, 'scripts/fixtures/registry-policy-invalid.json');
const result = spawnSync(process.execPath, ['scripts/check-registry-policy.mjs'], {
	cwd: appRoot,
	env: { ...process.env, WODE_REGISTRY_PATH: fixture },
	encoding: 'utf8',
});
const output = `${result.stdout}${result.stderr}`;
const expectedFailures = [
	'forbidden domain dependency: window-manager -> file-manager',
	'noncanonical registry dependency: window-manager -> https://registry.example.com/r/third-party.json',
	'duplicate target owner: @ui/status.tsx -> file-manager, window-manager',
	'duplicate source path owner: src/ui/status.tsx -> file-manager, window-manager',
];

if (result.status === 0 || expectedFailures.some((failure) => !output.includes(failure))) {
	throw new Error(`Registry policy fixture did not fail as expected:\n${output}`);
}

console.log('Registry policy fixture check passed.');
