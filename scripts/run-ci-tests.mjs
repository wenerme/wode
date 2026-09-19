import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const suites = {
	baseline: { directory: '.', config: 'vitest.ci.config.ts', args: [] },
	components: { directory: 'apps/components', config: 'vite.config.ts', args: ['--dir', 'src'] },
	storybook: { directory: 'apps/components', config: 'vitest.config.ts', args: [] },
};

/** Include staged, unstaged and untracked files for local use as well as PR commits. */
export function readChanges(base, cwd = repositoryRoot) {
	const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
	const commit = git('rev-parse', '--verify', '--end-of-options', `${base}^{commit}`).trim();
	const mergeBase = git('merge-base', commit, 'HEAD').trim();
	const fields = git('diff', '--name-status', '-z', '--no-renames', mergeBase, '--').split('\0');
	const changes = [];
	for (let index = 0; index < fields.length - 1; index += 2) {
		changes.push({ status: fields[index], file: fields[index + 1] });
	}
	for (const file of git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)) {
		changes.push({ status: 'A', file });
	}
	return { mergeBase, changes };
}

function isDocumentation(file) {
	if (/(?:^|\/)(?:__fixtures__|fixtures|__snapshots__|testdata|assets)\//.test(file)) return false;
	return /\.(?:md|mdx|rst)$/i.test(file) || /(?:^|\/)(?:README|CHANGELOG|CONTRIBUTING|LICENSE)$/.test(file);
}

/** Unknown inputs and graph-invalidating changes always retain full coverage. */
export function selectTests(suite, changes) {
	const relevant = changes.filter(({ file }) => !isDocumentation(file));
	if (!relevant.length) return { mode: 'skip', reason: 'No test inputs changed', files: [] };
	for (const { status, file } of relevant) {
		if (status !== 'A' && status !== 'M') {
			return { mode: 'full', reason: `Deleted or renamed input: ${file}`, files: [] };
		}
		// Related cannot see arbitrary filesystem reads, runtime imports or
		// dependency/config changes. Restrict graph selection to ordinary source.
		if (
			!/^(apps|packages)\/[^/]+\/(src|tests)\/.+\.[cm]?[jt]sx?$/.test(file) ||
			/(?:^|\/)(?:__fixtures__|fixtures|__snapshots__|testdata|assets)\//.test(file) ||
			/(?:^|\/)(?:[^/]*[.-])?(?:config|setup)\.[cm]?[jt]sx?$/.test(file) ||
			/\.d\.[cm]?ts$/.test(file)
		) {
			return { mode: 'full', reason: `Configuration, dependency or non-module input: ${file}`, files: [] };
		}
	}
	// Storybook transforms CSF into generated tests. A story file has a stable
	// related-test boundary; component/config changes still run both projects.
	if (suite === 'storybook') {
		if (relevant.every(({ file }) => /^apps\/components\/src\/.*\.stories\.[cm]?[jt]sx?$/.test(file))) {
			return { mode: 'related', reason: 'Select changed Storybook stories', files: relevant.map(({ file }) => file) };
		}
		return { mode: 'full', reason: 'Storybook generated-test coverage', files: [] };
	}
	if (suite === 'baseline' && relevant.some(({ file }) => file.startsWith('packages/'))) {
		return { mode: 'full', reason: 'Shared package changes may affect every baseline project', files: [] };
	}
	// Vite may externalize workspace packages; do not rely on traversing them
	// to select downstream component tests.
	if (suite === 'components' && relevant.some(({ file }) => !file.startsWith('apps/components/src/'))) {
		return { mode: 'full', reason: 'Changes outside the component source graph', files: [] };
	}
	return {
		mode: 'related',
		reason: 'Select tests through the source import graph',
		files: relevant.map(({ file }) => file),
	};
}

export function createTestCommand(suiteName, selection, root = repositoryRoot) {
	const suite = suites[suiteName];
	if (!suite) throw new Error(`Unknown CI test suite: ${suiteName}`);
	const cwd = path.resolve(root, suite.directory);
	const args = ['exec', 'vp', 'test'];
	if (selection.mode === 'related') {
		args.push('related', ...selection.files.map((file) => path.resolve(root, file)), '--run', '--passWithNoTests');
	} else {
		args.push('run');
	}
	args.push('--config', suite.config, ...suite.args);
	return { cwd, args };
}

export function main(args = process.argv.slice(2), { root = repositoryRoot, env = process.env, run = spawnSync } = {}) {
	const { values, positionals } = parseArgs({
		args,
		allowPositionals: true,
		options: { base: { type: 'string' }, full: { type: 'boolean' }, 'dry-run': { type: 'boolean' } },
	});
	const [suiteName = 'baseline'] = positionals;
	if (positionals.length > 1 || !suites[suiteName])
		throw new Error('Expected suite: baseline, components or storybook');
	const base = values.base ?? env.WODE_TEST_BASE;
	let selection = { mode: 'full', reason: 'No incremental base requested', files: [] };
	if (values.full) {
		selection.reason = 'Full suite explicitly requested';
	} else if (base) {
		try {
			const { mergeBase, changes } = readChanges(base, root);
			console.log(`[ci-tests:${suiteName}] merge-base=${mergeBase}; changed files=${changes.length}`);
			selection = selectTests(suiteName, changes);
		} catch {
			selection.reason = 'Git base or history unavailable; falling back to the full suite';
		}
	}
	console.log(`[ci-tests:${suiteName}] ${selection.mode}: ${selection.reason}`);
	if (selection.mode === 'skip') return 0;
	const command = createTestCommand(suiteName, selection, root);
	if (values['dry-run']) {
		console.log(JSON.stringify(command, null, 2));
		return 0;
	}
	// No shell expansion: changed filenames remain individual literal arguments.
	const result = run('pnpm', command.args, { cwd: command.cwd, stdio: 'inherit' });
	if (result.error) throw result.error;
	return result.status ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	process.exitCode = main();
}
