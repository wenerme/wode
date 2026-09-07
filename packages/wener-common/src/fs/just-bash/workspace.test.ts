import { describe, expect, it } from 'vite-plus/test';
import { createMemoryFileSystem } from '../createMemoryFileSystem';
import {
	createJustBashWorkspace,
	createJustBashWorkspaceFromLoader,
	DefaultJustBashExecutionLimits,
	ExtendedJustBashWorkspaceCommands,
	JustBashWorkspaceSemantics,
} from './workspace';

const loadJustBash = () => import('just-bash/browser');

async function createWorkspace(
	options: { readOnly?: boolean; onWorkspaceChanged?: () => void; extended?: boolean } = {},
) {
	const fs = createMemoryFileSystem();
	await fs.mkdir('/project/demo', { recursive: true });
	await fs.writeFile('/project/README.md', 'hello\n');
	const workspace = await createJustBashWorkspaceFromLoader(loadJustBash, {
		fs,
		fsRoot: '/project',
		workspaceRoot: '/workspace',
		readOnly: options.readOnly,
		onWorkspaceChanged: options.onWorkspaceChanged,
		commands: options.extended ? ExtendedJustBashWorkspaceCommands : undefined,
	});
	return { fs, workspace };
}

describe('createJustBashWorkspace', () => {
	it('keeps direct Bash and bashModule construction available', async () => {
		const runtime = await loadJustBash();
		const bashWorkspace = createJustBashWorkspace({ fs: createMemoryFileSystem(), Bash: runtime.Bash });
		const moduleWorkspace = createJustBashWorkspace({ fs: createMemoryFileSystem(), bashModule: runtime });

		expect(await bashWorkspace.exec('printf direct')).toMatchObject({ stdout: 'direct', exitCode: 0 });
		expect(await moduleWorkspace.exec('printf module')).toMatchObject({ stdout: 'module', exitCode: 0 });
	});

	it('executes default commands against the supplied shared filesystem', async () => {
		const { fs, workspace } = await createWorkspace();
		expect(await workspace.exec('pwd')).toMatchObject({
			stdout: '/workspace\n',
			exitCode: 0,
			workspaceChanged: false,
			semantics: JustBashWorkspaceSemantics,
		});

		expect(await workspace.exec('echo "shell ok" > generated.txt')).toMatchObject({
			exitCode: 0,
			workspaceChanged: true,
		});
		await expect(fs.readFile('/project/generated.txt', { encoding: 'text' })).resolves.toBe('shell ok\n');
		expect(await workspace.exec('cat README.md generated.txt')).toMatchObject({
			stdout: 'hello\nshell ok\n',
			exitCode: 0,
		});
	});

	it('describes isolated raw cwd/env semantics and returns the next state explicitly', async () => {
		const { workspace } = await createWorkspace();
		const changed = await workspace.exec('cd demo && export NAME=Wener && pwd');
		expect(changed).toMatchObject({ stdout: '/workspace/demo\n', cwd: '/workspace/demo' });
		expect(changed.env.NAME).toBe('Wener');
		expect(await workspace.exec('pwd')).toMatchObject({ stdout: '/workspace\n', cwd: '/workspace' });
		expect(await workspace.exec('echo "$NAME"')).toMatchObject({ stdout: '\n' });
		expect(workspace.semantics).toMatchObject({
			hostFileSystem: false,
			persistentShellState: false,
			supportsConcurrentExecution: false,
		});
	});

	it('includes virtual system paths and the realpath custom command', async () => {
		const { workspace } = await createWorkspace();
		expect(await workspace.exec('ls /')).toMatchObject({
			stdout: 'dev\nhome\ntmp\nworkspace\n',
			exitCode: 0,
		});
		expect(await workspace.exec('realpath . README.md missing')).toMatchObject({
			stdout: '/workspace\n/workspace/README.md\n',
			stderr: 'realpath: missing: No such file or directory\n',
			exitCode: 1,
		});
		expect(await workspace.exec('echo ignored > /dev/null')).toMatchObject({
			exitCode: 0,
			workspaceChanged: false,
		});
		expect(await workspace.exec('cat /dev/stdin', { stdin: 'bound input\n' })).toMatchObject({
			stdout: 'bound input\n',
			exitCode: 0,
		});
		expect(await workspace.exec('cat /dev/stdin')).toMatchObject({ stdout: '', exitCode: 0 });
	});

	it('reports backing mutations and preserves virtual-only mutation isolation', async () => {
		let changes = 0;
		const { workspace } = await createWorkspace({ onWorkspaceChanged: () => changes++ });
		expect(await workspace.exec('cat README.md')).toMatchObject({ workspaceChanged: false });
		expect(await workspace.exec('echo cache > /tmp/cache.txt')).toMatchObject({ workspaceChanged: false });
		const changed = await workspace.exec('echo shared > shared.txt');
		expect(changed).toMatchObject({ workspaceChanged: true, workspaceRevisionBefore: 0 });
		expect(changed.workspaceRevisionAfter).toBeGreaterThan(changed.workspaceRevisionBefore);
		expect(workspace.workspaceVersion).toBe(changed.workspaceRevisionAfter);
		expect(changes).toBe(1);
	});

	it('enforces read-only workspaces and exposes bounded execution limits', async () => {
		const { fs, workspace } = await createWorkspace({ readOnly: true });
		await expect(workspace.exec('echo no > blocked.txt')).rejects.toThrow('read-only');
		expect(await fs.exists('/project/blocked.txt')).toBe(false);
		expect(workspace.executionLimits).toMatchObject(DefaultJustBashExecutionLimits);
	});

	it('uses a custom workspace mount as the default cwd', async () => {
		const fs = createMemoryFileSystem();
		await fs.mkdir('/project', { recursive: true });
		const workspace = await createJustBashWorkspaceFromLoader(loadJustBash, {
			fs,
			fsRoot: '/project',
			workspaceRoot: '/sandbox',
		});
		expect(await workspace.exec('pwd')).toMatchObject({ stdout: '/sandbox\n', cwd: '/sandbox' });
	});

	it('supports the extended command list without changing workspace semantics', async () => {
		const { workspace } = await createWorkspace({ extended: true });
		expect(await workspace.exec('printf "alpha\\nbeta\\n" | wc -l')).toMatchObject({
			stdout: '2\n',
			exitCode: 0,
			workspaceChanged: false,
		});
	});
});
