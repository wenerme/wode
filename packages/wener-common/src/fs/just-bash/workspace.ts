import type { Bash, BashExecResult, BashOptions, Command, CommandName } from 'just-bash';
import type { Bash as BrowserBash } from 'just-bash/browser';
import type { IFileSystem } from '../IFileSystem';
import { createJustBashFileSystemAdapter, type JustBashFileSystemAdapter } from './adapter';
import { normalizeVirtualPath } from './paths';

export type JustBashModule = Readonly<{ Bash: typeof BrowserBash }>;
export type JustBashModuleLoader = () => JustBashModule | Promise<JustBashModule>;
type BashConstructor = JustBashModule['Bash'];
export type JustBashExecutionLimits = NonNullable<BashOptions['executionLimits']>;

export type JustBashExecutionSemantics = {
	backendKind: 'just-bash';
	sharedFileSystem: true;
	hostFileSystem: false;
	persistentShellState: false;
	supportsStreaming: false;
	supportsInteractiveTty: false;
	supportsEnvPersistence: false;
	supportsCwdPersistence: false;
	supportsConcurrentExecution: false;
};

export const JustBashWorkspaceSemantics: Readonly<JustBashExecutionSemantics> = Object.freeze({
	backendKind: 'just-bash',
	sharedFileSystem: true,
	hostFileSystem: false,
	persistentShellState: false,
	supportsStreaming: false,
	supportsInteractiveTty: false,
	supportsEnvPersistence: false,
	supportsCwdPersistence: false,
	supportsConcurrentExecution: false,
});

export const DefaultJustBashWorkspaceCommands = [
	'pwd',
	'ls',
	'cat',
	'echo',
	'printf',
	'mkdir',
	'touch',
	'rm',
	'cp',
	'mv',
	'find',
	'grep',
	'head',
	'tail',
	'wc',
	'stat',
	'env',
	'printenv',
	'which',
	'whoami',
	'help',
] as const satisfies readonly CommandName[];

export const ExtendedJustBashWorkspaceCommands = [
	'echo',
	'cat',
	'printf',
	'ls',
	'mkdir',
	'rmdir',
	'touch',
	'rm',
	'cp',
	'mv',
	'pwd',
	'head',
	'tail',
	'wc',
	'stat',
	'grep',
	'fgrep',
	'egrep',
	'rg',
	'sed',
	'awk',
	'sort',
	'uniq',
	'comm',
	'cut',
	'paste',
	'tr',
	'rev',
	'nl',
	'fold',
	'expand',
	'unexpand',
	'strings',
	'split',
	'column',
	'join',
	'tee',
	'find',
	'basename',
	'dirname',
	'tree',
	'du',
	'env',
	'printenv',
	'true',
	'false',
	'clear',
	'jq',
	'base64',
	'diff',
	'date',
	'sleep',
	'timeout',
	'seq',
	'expr',
	'md5sum',
	'sha1sum',
	'sha256sum',
	'file',
	'help',
	'which',
	'tac',
	'hostname',
	'od',
	'whoami',
] as const satisfies readonly CommandName[];

export const DefaultJustBashExecutionLimits: Readonly<JustBashExecutionLimits> = Object.freeze({
	maxCommandCount: 256,
	maxLoopIterations: 4_096,
	maxCallDepth: 32,
	maxOutputSize: 1024 * 1024,
});

export const RealpathWorkspaceCommand: Command = {
	name: 'realpath',
	async execute(args, context) {
		if (args.length === 0) return { stdout: '', stderr: 'realpath: missing operand\n', exitCode: 1 };
		const stdout: string[] = [];
		const stderr: string[] = [];
		let failed = false;
		let parseOptions = true;
		for (const argument of args) {
			if (parseOptions && argument === '--help') {
				return {
					stdout: 'Usage: realpath FILE...\nPrint resolved absolute workspace paths.\n',
					stderr: '',
					exitCode: 0,
				};
			}
			if (parseOptions && argument === '--') {
				parseOptions = false;
				continue;
			}
			if (parseOptions && argument.startsWith('-')) {
				return { stdout: '', stderr: `realpath: unsupported option ${argument}\n`, exitCode: 1 };
			}
			try {
				stdout.push(`${await context.fs.realpath(context.fs.resolvePath(context.cwd, argument))}\n`);
			} catch {
				failed = true;
				stderr.push(`realpath: ${argument}: No such file or directory\n`);
			}
		}
		return { stdout: stdout.join(''), stderr: stderr.join(''), exitCode: failed ? 1 : 0 };
	},
};

export const DefaultJustBashWorkspaceCustomCommands = [RealpathWorkspaceCommand] as const satisfies readonly Command[];

export type JustBashWorkspaceExecOptions = {
	cwd?: string;
	stdin?: string;
	stdinKind?: 'text' | 'bytes';
	env?: Record<string, string>;
	replaceEnv?: boolean;
	signal?: AbortSignal;
};

export type JustBashWorkspaceExecResult = {
	command: string;
	stdout: string;
	stderr: string;
	exitCode: number;
	cwd: string;
	env: Record<string, string>;
	durationMs: number;
	workspaceChanged: boolean;
	workspaceRevisionBefore: number;
	workspaceRevisionAfter: number;
	semantics: Readonly<JustBashExecutionSemantics>;
	metadata?: Record<string, unknown>;
};

export type JustBashWorkspace = {
	readonly fs: IFileSystem;
	readonly cwd: string;
	readonly semantics: Readonly<JustBashExecutionSemantics>;
	readonly executionLimits: Readonly<JustBashExecutionLimits>;
	/** Monotonic revision incremented after each successful backing-filesystem mutation. */
	readonly workspaceVersion: number;
	/**
	 * Abort is cooperative. An injected IFileSystem may ignore its AbortSignal and keep mutating after abort;
	 * use JustBashAgentSession when terminal settlement must be reported explicitly.
	 */
	exec(command: string, options?: JustBashWorkspaceExecOptions): Promise<JustBashWorkspaceExecResult>;
};

export type CreateJustBashWorkspaceOptions = {
	fs: IFileSystem;
	Bash?: BashConstructor;
	bashModule?: JustBashModule;
	cwd?: string;
	workspaceRoot?: string;
	fsRoot?: string;
	readOnly?: boolean;
	maxReadBytes?: number;
	maxAppendBytes?: number;
	commands?: readonly CommandName[];
	customCommands?: readonly Command[];
	onWorkspaceChanged?: () => void;
	env?: Record<string, string>;
	executionLimits?: JustBashExecutionLimits;
	bashOptions?: Omit<BashOptions, 'fs' | 'cwd' | 'commands' | 'customCommands' | 'env' | 'executionLimits'>;
};

class JustBashWorkspaceImplementation implements JustBashWorkspace {
	readonly semantics = JustBashWorkspaceSemantics;
	private running = false;

	constructor(
		readonly fs: IFileSystem,
		readonly cwd: string,
		readonly executionLimits: Readonly<JustBashExecutionLimits>,
		private readonly bash: Bash,
		private readonly bashFs: JustBashFileSystemAdapter,
		private readonly getMutationVersion: () => number,
		private readonly onWorkspaceChanged?: () => void,
	) {}

	get workspaceVersion(): number {
		return this.getMutationVersion();
	}

	async exec(command: string, options: JustBashWorkspaceExecOptions = {}): Promise<JustBashWorkspaceExecResult> {
		if (this.running) throw new Error('Concurrent just-bash workspace execution is not supported');
		this.running = true;
		const startedAt = performanceNow();
		const workspaceRevisionBefore = this.getMutationVersion();
		const cwd = normalizeVirtualPath(options.cwd ?? this.cwd, 'cwd');
		let result: BashExecResult;
		try {
			this.bashFs.setExecutionContext({
				signal: options.signal,
				stdin: options.stdin,
				stdinKind: options.stdinKind,
			});
			try {
				result = await this.bash.exec(command, {
					cwd,
					stdin: options.stdin,
					stdinKind: options.stdinKind,
					env: options.env,
					replaceEnv: options.replaceEnv,
					signal: options.signal,
				});
			} finally {
				this.bashFs.clearExecutionContext();
			}
		} finally {
			this.running = false;
			if (this.getMutationVersion() !== workspaceRevisionBefore) this.onWorkspaceChanged?.();
		}
		const workspaceRevisionAfter = this.getMutationVersion();
		return {
			command,
			stdout: result.stdout,
			stderr: result.stderr,
			exitCode: result.exitCode,
			cwd: typeof result.env.PWD === 'string' ? result.env.PWD : cwd,
			env: result.env,
			durationMs: Math.max(0, performanceNow() - startedAt),
			workspaceChanged: workspaceRevisionAfter !== workspaceRevisionBefore,
			workspaceRevisionBefore,
			workspaceRevisionAfter,
			semantics: this.semantics,
			metadata: result.metadata,
		};
	}
}

export function createJustBashWorkspace({
	fs,
	Bash: BashInput,
	bashModule,
	cwd,
	workspaceRoot = '/workspace',
	fsRoot = '/',
	readOnly = false,
	maxReadBytes,
	maxAppendBytes,
	commands = DefaultJustBashWorkspaceCommands,
	customCommands = [],
	onWorkspaceChanged,
	env,
	executionLimits,
	bashOptions,
}: CreateJustBashWorkspaceOptions): JustBashWorkspace {
	const BashCtor = BashInput ?? bashModule?.Bash;
	if (!BashCtor) throw new Error('createJustBashWorkspace requires Bash or bashModule');
	const resolvedLimits = resolveExecutionLimits(executionLimits);
	let mutationVersion = 0;
	const bashFs = createJustBashFileSystemAdapter({
		fs,
		workspaceRoot,
		fsRoot,
		readOnly,
		maxReadBytes,
		maxAppendBytes,
		onWorkspaceChanged: () => {
			mutationVersion++;
		},
	});
	const normalizedCwd = normalizeVirtualPath(cwd ?? workspaceRoot, 'cwd');
	const bash = new BashCtor({
		...bashOptions,
		fs: bashFs,
		cwd: normalizedCwd,
		commands: [...commands],
		customCommands: [...DefaultJustBashWorkspaceCustomCommands, ...customCommands],
		env,
		executionLimits: resolvedLimits,
	});
	return new JustBashWorkspaceImplementation(
		fs,
		normalizedCwd,
		resolvedLimits,
		bash,
		bashFs,
		() => mutationVersion,
		onWorkspaceChanged,
	);
}

export async function createJustBashWorkspaceFromLoader(
	loader: JustBashModuleLoader,
	options: Omit<CreateJustBashWorkspaceOptions, 'Bash' | 'bashModule'>,
): Promise<JustBashWorkspace> {
	const bashModule = await loader();
	return createJustBashWorkspace({ ...options, bashModule });
}

function resolveExecutionLimits(input: JustBashExecutionLimits | undefined): Readonly<JustBashExecutionLimits> {
	const limits = { ...DefaultJustBashExecutionLimits, ...input };
	for (const [name, value] of Object.entries(limits)) {
		if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
			throw new Error(`Invalid just-bash execution limit ${name}: expected a positive integer`);
		}
	}
	return Object.freeze(limits);
}

function performanceNow(): number {
	return typeof performance === 'undefined' ? Date.now() : performance.now();
}
