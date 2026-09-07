import { describe, expect, it } from 'vite-plus/test';
import { createMemoryFileSystem } from '../createMemoryFileSystem';
import type { IFileSystem } from '../IFileSystem';
import {
	type CreateJustBashAgentSessionOptions,
	createJustBashAgentSession,
	MaxJustBashAgentCancellationSettleMs,
	MaxJustBashAgentEnvBytes,
	MaxJustBashAgentOutputBytes,
	MaxJustBashAgentStdinBytes,
	MaxJustBashAgentTimeoutMs,
} from './session';
import {
	createJustBashWorkspaceFromLoader,
	ExtendedJustBashWorkspaceCommands,
	type JustBashExecutionLimits,
} from './workspace';

const loadJustBash = () => import('just-bash/browser');

type SessionOptions = Omit<CreateJustBashAgentSessionOptions, 'workspace'>;

async function createSession(options: SessionOptions = {}, fs = createMemoryFileSystem()) {
	await fs.mkdir('/project/demo', { recursive: true });
	const workspace = await createJustBashWorkspaceFromLoader(loadJustBash, {
		fs,
		fsRoot: '/project',
		workspaceRoot: '/workspace',
		commands: ExtendedJustBashWorkspaceCommands,
	});
	return {
		fs,
		workspace,
		session: createJustBashAgentSession({ workspace, ...options }),
	};
}

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((settle) => {
		resolve = settle;
	});
	return { promise, resolve };
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function overrideWriteFile(fs: IFileSystem, writeFile: IFileSystem['writeFile']): IFileSystem {
	return new Proxy(fs, {
		get(target, property) {
			if (property === 'writeFile') return writeFile;
			const value = Reflect.get(target, property, target);
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
}

describe('createJustBashAgentSession', () => {
	it('returns structured results and persists explicit cwd/env session state', async () => {
		const { session } = await createSession();
		const first = await session.exec('cd demo && export NAME=Wener && pwd');
		expect(first).toMatchObject({
			stdout: '/workspace/demo\n',
			stderr: '',
			exitCode: 0,
			cwd: '/workspace/demo',
			timedOut: false,
			aborted: false,
			truncated: false,
			workspaceChanged: false,
			settled: true,
			mutationMayContinue: false,
			poisoned: false,
		});
		expect(first.durationMs).toBeGreaterThanOrEqual(0);
		expect(await session.exec('printf "$NAME:%s\\n" "$PWD"')).toMatchObject({
			stdout: 'Wener:/workspace/demo\n',
			cwd: '/workspace/demo',
		});
		expect(session.getState()).toMatchObject({ cwd: '/workspace/demo', env: { NAME: 'Wener' } });
	});

	it('reports shared workspace changes in completed commands', async () => {
		const { fs, session } = await createSession();
		const result = await session.exec('echo changed > result.txt');
		expect(result).toMatchObject({ exitCode: 0, workspaceChanged: true, timedOut: false });
		await expect(fs.readFile('/project/result.txt', { encoding: 'text' })).resolves.toBe('changed\n');
	});

	it('caps combined output by UTF-8 bytes without splitting code points', async () => {
		const { session } = await createSession({ maxOutputBytes: 8 });
		const result = await session.exec("printf '你好abcdef'");
		expect(result.stdout).toBe('你好ab');
		expect(new TextEncoder().encode(result.stdout).byteLength).toBe(8);
		expect(result).toMatchObject({ exitCode: 0, truncated: true, timedOut: false });
	});

	it('rejects oversized command input without executing it', async () => {
		const { fs, session } = await createSession({ maxCommandBytes: 16 });
		const result = await session.exec('echo forbidden > x');
		expect(result).toMatchObject({
			exitCode: 126,
			limitReason: 'command-too-long',
			timedOut: false,
			workspaceChanged: false,
		});
		expect(await fs.exists('/project/x')).toBe(false);
	});

	it('rejects oversized stdin and aggregate environment keys plus values before execution', async () => {
		const stdinFixture = await createSession({ maxStdinBytes: 4 });
		expect(await stdinFixture.session.exec('cat > stdin.txt', { stdin: '12345' })).toMatchObject({
			exitCode: 126,
			limitReason: 'stdin-too-long',
			settled: true,
		});
		expect(await stdinFixture.fs.exists('/project/stdin.txt')).toBe(false);

		const envFixture = await createSession({ maxEnvBytes: 12 });
		expect(await envFixture.session.exec('echo no > env.txt', { env: { LONGKEY: '123456' } })).toMatchObject({
			exitCode: 126,
			limitReason: 'env-too-large',
			settled: true,
		});
		expect(await envFixture.fs.exists('/project/env.txt')).toBe(false);
		expect(() =>
			createJustBashAgentSession({ workspace: envFixture.workspace, maxEnvBytes: 9, env: { ABCDE: '12345' } }),
		).toThrow('aggregate UTF-8 bytes');
	});

	it('settles timeout with a bounded structured result', async () => {
		const { session } = await createSession({ timeoutMs: 20 });
		const startedAt = Date.now();
		const result = await session.exec('sleep 1');
		expect(Date.now() - startedAt).toBeLessThan(500);
		expect(result).toMatchObject({
			exitCode: 124,
			timedOut: true,
			aborted: false,
			limitReason: 'timeout',
			truncated: false,
			settled: true,
			mutationMayContinue: false,
		});
	});

	it('settles external abort and prevents concurrent execution on the same Bash instance', async () => {
		const { session } = await createSession({ timeoutMs: 1_000 });
		const controller = new AbortController();
		const pending = session.exec('sleep 1', { signal: controller.signal });
		const concurrent = await session.exec('echo overlap');
		expect(concurrent).toMatchObject({ exitCode: 125, limitReason: 'busy' });
		controller.abort();
		const result = await pending;
		expect(result).toMatchObject({
			exitCode: 130,
			timedOut: false,
			aborted: true,
			limitReason: 'aborted',
			settled: true,
			mutationMayContinue: false,
		});
	});

	it('reports mutations completed before timeout', async () => {
		const { fs, session } = await createSession({ timeoutMs: 20 });
		const result = await session.exec('echo before-timeout > partial.txt; sleep 1');
		expect(result).toMatchObject({
			exitCode: 124,
			timedOut: true,
			workspaceChanged: true,
			workspaceRevisionBefore: 0,
			settled: true,
		});
		expect(result.workspaceRevisionAfter).toBeGreaterThan(result.workspaceRevisionBefore);
		await expect(fs.readFile('/project/partial.txt', { encoding: 'text' })).resolves.toBe('before-timeout\n');
	});

	it('waits for a delayed uncooperative write to settle and reports its final revision', async () => {
		const baseFs = createMemoryFileSystem();
		const writeStarted = deferred();
		const delayedFs = overrideWriteFile(baseFs, async (path, data, options) => {
			if (data instanceof Uint8Array && data.byteLength === 0) {
				await baseFs.writeFile(path, data, { ...options, signal: undefined });
				return;
			}
			writeStarted.resolve();
			await delay(40);
			await baseFs.writeFile(path, data, { ...options, signal: undefined });
		});
		const { session, workspace } = await createSession({ timeoutMs: 1_000, cancellationSettleMs: 200 }, delayedFs);
		const controller = new AbortController();
		const pending = session.exec('echo delayed > delayed.txt', { signal: controller.signal });
		await writeStarted.promise;
		controller.abort();
		const result = await pending;

		expect(result).toMatchObject({
			exitCode: 130,
			aborted: true,
			settled: true,
			mutationMayContinue: false,
			poisoned: false,
			workspaceChanged: true,
			workspaceRevisionBefore: 0,
			workspaceRevisionAfter: 2,
		});
		await expect(baseFs.readFile('/project/delayed.txt', { encoding: 'text' })).resolves.toBe('delayed\n');
		const revisionAfterReturn = workspace.workspaceVersion;
		await delay(60);
		expect(workspace.workspaceVersion).toBe(revisionAfterReturn);
		await expect(baseFs.readFile('/project/delayed.txt', { encoding: 'text' })).resolves.toBe('delayed\n');
	});

	it('poisons the session when I/O never settles and reports possible post-return mutation', async () => {
		const baseFs = createMemoryFileSystem();
		const writeStarted = deferred();
		const neverSettlingFs = overrideWriteFile(baseFs, async (path, data, options) => {
			if (data instanceof Uint8Array && data.byteLength === 0) {
				await baseFs.writeFile(path, data, { ...options, signal: undefined });
				return;
			}
			writeStarted.resolve();
			await delay(50);
			await baseFs.writeFile(path, data, { ...options, signal: undefined });
			await new Promise<void>(() => undefined);
		});
		const { session } = await createSession({ timeoutMs: 1_000, cancellationSettleMs: 15 }, neverSettlingFs);
		const controller = new AbortController();
		const pending = session.exec('echo late > late.txt', { signal: controller.signal });
		await writeStarted.promise;
		controller.abort();
		const result = await pending;

		expect(result).toMatchObject({
			exitCode: 130,
			limitReason: 'aborted',
			settled: false,
			mutationMayContinue: true,
			poisoned: true,
			workspaceRevisionBefore: 0,
			workspaceRevisionAfter: 1,
		});
		expect(session.getState().poisoned).toBe(true);
		expect(await session.exec('echo forbidden > forbidden.txt')).toMatchObject({
			exitCode: 125,
			limitReason: 'session-poisoned',
			settled: false,
			mutationMayContinue: true,
			poisoned: true,
		});
		await delay(70);
		await expect(baseFs.readFile('/project/late.txt', { encoding: 'text' })).resolves.toBe('late\n');
		expect(await baseFs.exists('/project/forbidden.txt')).toBe(false);
	});

	it('enforces command count, loop and call-depth limits during execution', async () => {
		const runLimited = async (executionLimits: JustBashExecutionLimits, command: string) => {
			const fs = createMemoryFileSystem();
			const workspace = await createJustBashWorkspaceFromLoader(loadJustBash, {
				fs,
				commands: ExtendedJustBashWorkspaceCommands,
				executionLimits,
			});
			return createJustBashAgentSession({ workspace }).exec(command);
		};

		expect(await runLimited({ maxCommandCount: 2 }, 'echo 1; echo 2; echo 3')).toMatchObject({
			exitCode: 126,
			stderr: expect.stringContaining('maxCommandCount'),
		});
		expect(await runLimited({ maxLoopIterations: 2 }, 'for i in a b c; do echo item; done')).toMatchObject({
			exitCode: 126,
			stderr: expect.stringContaining('maxLoopIterations'),
		});
		expect(await runLimited({ maxCallDepth: 2 }, 'f(){ f; }; f')).toMatchObject({
			exitCode: 126,
			stderr: expect.stringContaining('maxCallDepth'),
		});
	});

	it('rejects session timeout and workspace execution limits above Agent ceilings', async () => {
		const { workspace } = await createSession();
		expect(() => createJustBashAgentSession({ workspace, timeoutMs: MaxJustBashAgentTimeoutMs + 1 })).toThrow(
			'timeoutMs',
		);

		const fs = createMemoryFileSystem();
		const unbounded = await createJustBashWorkspaceFromLoader(loadJustBash, {
			fs,
			executionLimits: { maxCommandCount: 513 },
		});
		expect(() => createJustBashAgentSession({ workspace: unbounded })).toThrow('maxCommandCount <= 512');
		expect(() =>
			createJustBashAgentSession({
				workspace,
				cancellationSettleMs: MaxJustBashAgentCancellationSettleMs + 1,
			}),
		).toThrow('cancellationSettleMs');
		expect(() => createJustBashAgentSession({ workspace, maxStdinBytes: MaxJustBashAgentStdinBytes + 1 })).toThrow(
			'maxStdinBytes',
		);
		expect(() => createJustBashAgentSession({ workspace, maxEnvBytes: MaxJustBashAgentEnvBytes + 1 })).toThrow(
			'maxEnvBytes',
		);

		const outputUnbounded = await createJustBashWorkspaceFromLoader(loadJustBash, {
			fs: createMemoryFileSystem(),
			executionLimits: { maxOutputSize: MaxJustBashAgentOutputBytes + 1 },
		});
		expect(() => createJustBashAgentSession({ workspace: outputUnbounded })).toThrow(
			`maxOutputSize <= ${MaxJustBashAgentOutputBytes}`,
		);
	});
});
