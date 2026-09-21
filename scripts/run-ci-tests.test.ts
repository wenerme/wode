import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTestCommand, main, readChanges, selectTests } from './run-ci-tests.mjs';

const temporaryRoots: string[] = [];

afterEach(() => {
	for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
	vi.restoreAllMocks();
});

function repository() {
	const root = mkdtempSync(path.join(tmpdir(), 'ci-test-selection-'));
	temporaryRoots.push(root);
	const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
	const write = (file: string, contents = 'initial\n') => {
		mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
		writeFileSync(path.join(root, file), contents);
	};
	git('init', '-q', '-b', 'main');
	git('config', 'user.name', 'CI Test');
	git('config', 'user.email', 'ci@example.com');
	git('config', 'commit.gpgsign', 'false');
	git('config', 'core.hooksPath', path.join(root, 'no-hooks'));
	write('README.md');
	write('apps/components/src/original.ts');
	git('add', '.');
	git('commit', '-qm', 'base');
	return { root, git, write };
}

describe('Git change selection', () => {
	test('uses merge-base and includes committed, staged, unstaged and untracked paths literally', () => {
		const { root, git, write } = repository();
		const base = git('rev-parse', 'HEAD');
		git('checkout', '-qb', 'feature');
		write('apps/components/src/committed.ts');
		git('add', '.');
		git('commit', '-qm', 'feature');
		git('checkout', '-q', 'main');
		write('target-only.ts');
		git('add', '.');
		git('commit', '-qm', 'target advanced');
		git('checkout', '-q', 'feature');
		write('apps/components/src/staged.ts');
		git('add', '.');
		write('apps/components/src/original.ts', 'changed\n');
		const unusual = 'apps/components/src/space $(echo injected).ts';
		write(unusual);
		const result = readChanges('main', root);
		expect(result.mergeBase).toBe(base);
		expect(result.changes).toEqual(
			expect.arrayContaining([
				{ status: 'A', file: 'apps/components/src/committed.ts' },
				{ status: 'A', file: 'apps/components/src/staged.ts' },
				{ status: 'M', file: 'apps/components/src/original.ts' },
				{ status: 'A', file: unusual },
			]),
		);
		expect(result.changes).toHaveLength(4);
		const command = createTestCommand('components', selectTests('components', result.changes), root);
		expect(command.cwd).toBe(path.join(root, 'apps/components'));
		expect(command.args).toContain(path.join(root, unusual));
		expect(command.args).toContain('--run');
	});

	test('retains the deleted side of a rename to force a complete suite', () => {
		const { root, git } = repository();
		git('mv', 'apps/components/src/original.ts', 'apps/components/src/renamed.ts');
		const { changes } = readChanges('HEAD', root);
		expect(changes).toContainEqual({ status: 'D', file: 'apps/components/src/original.ts' });
		expect(selectTests('components', changes).mode).toBe('full');
	});
});

describe('test coverage boundaries', () => {
	test('selects related component modules and permits an empty related selection', () => {
		const selected = selectTests('components', [{ status: 'M', file: 'apps/components/src/ui/button.tsx' }]);
		expect(selected.mode).toBe('related');
		expect(createTestCommand('components', selected).args).toContain('--passWithNoTests');
		expect(createTestCommand('components', { mode: 'full', files: [] }).args).not.toContain('--passWithNoTests');
	});

	test.each([
		'pnpm-lock.yaml',
		'pnpm-workspace.yaml',
		'package.json',
		'apps/components/package.json',
		'vitest.ci.config.ts',
		'apps/components/vitest.config.ts',
		'apps/components/.storybook/preview.tsx',
		'just/ci.just',
		'.github/workflows/build.yaml',
		'scripts/run-ci-tests.mjs',
		'packages/wener-common/src/fs/fixtures/file.ts',
		'apps/components/src/example/__snapshots__/test.snap',
		'apps/components/public/image.png',
		'apps/components/src/styles.css',
		'apps/components/src/custom.d.ts',
		'apps/components/src/fixtures/example.ts',
	])('falls back for graph-invisible input %s', (file) => {
		expect(selectTests('components', [{ status: 'M', file }]).mode).toBe('full');
	});

	test('skips only conventional documentation or an unchanged tree', () => {
		expect(selectTests('components', []).mode).toBe('skip');
		expect(
			selectTests('components', [
				{ status: 'M', file: 'README.md' },
				{ status: 'M', file: 'apps/components/README.md' },
				{ status: 'M', file: 'apps/components/README.mdx' },
				{ status: 'M', file: 'apps/components/src/example/README.md' },
				{ status: 'M', file: 'docs/guide.md' },
				{ status: 'M', file: 'packages/demo/notes.rst' },
			]).mode,
		).toBe('skip');
	});

	test('keeps shared-package and Storybook coverage conservative', () => {
		const common = [{ status: 'M', file: 'packages/wener-common/src/fs/MemoryFileSystem.ts' }];
		expect(selectTests('components', common).mode).toBe('full');
		expect(selectTests('baseline', common).mode).toBe('full');
		expect(selectTests('storybook', [{ status: 'M', file: 'apps/components/src/ui/button.tsx' }]).mode).toBe('full');
		expect(selectTests('storybook', [{ status: 'M', file: 'apps/components/src/stories/ui.stories.tsx' }]).mode).toBe(
			'related',
		);
	});
});

describe('runner failure handling', () => {
	test('defaults to a complete suite and propagates test failures', () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		const run = vi.fn(() => ({ status: 7 }));
		expect(main(['baseline'], { env: {}, run })).toBe(7);
		expect(run.mock.calls[0]?.[1]).toContain('run');
	});

	test('missing Git history falls back to a complete suite', () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		const { root } = repository();
		const run = vi.fn(() => ({ status: 0 }));
		expect(main(['components', '--base', 'unknown-ref'], { root, env: {}, run })).toBe(0);
		expect(run.mock.calls[0]?.[1]).toContain('run');
		expect(run.mock.calls[0]?.[1]).not.toContain('--passWithNoTests');
	});

	test('a documentation-only change does not start Vitest; --full overrides it', () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		const { root, write } = repository();
		write('README.md', 'documentation\n');
		const run = vi.fn(() => ({ status: 0 }));
		const options = { root, env: { WODE_TEST_BASE: 'HEAD' }, run };
		expect(main(['components'], options)).toBe(0);
		expect(run).not.toHaveBeenCalled();
		expect(main(['components', '--full'], options)).toBe(0);
		expect(run).toHaveBeenCalledOnce();
	});

	test('aborted or unstartable test processes fail CI', () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		expect(main(['baseline'], { env: {}, run: () => ({ status: null }) })).toBe(1);
		expect(() => main(['baseline'], { env: {}, run: () => ({ error: new Error('spawn failed') }) })).toThrow(
			'spawn failed',
		);
	});
});
