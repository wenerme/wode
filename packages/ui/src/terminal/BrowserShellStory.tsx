import type { Terminal } from '@xterm/xterm';
import type { Bash } from 'just-bash/browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	deleteTerminalBackward,
	moveTerminalCursor,
	normalizeTerminalCursor,
	renderTerminalInput,
} from './line-editing';
import { TerminalView, type TerminalViewHandle, type TerminalViewProps } from './TerminalView';

const workspace = '/workspace';
const prompt = (cwd: string) => `\x1b[1;36mstorybook\x1b[0m:\x1b[1;34m${cwd}\x1b[0m$ `;
const mebibyte = 1024 * 1024;
const isSimpleAsciiText = (value: string) => /^[\x20-\x7E]*$/.test(value);
function writeShellOutput(terminal: Terminal, output: string, color?: string) {
	if (!output) return;
	const text = output.endsWith('\n') ? output : `${output}\n`;
	terminal.write(`${color ?? ''}${text.replace(/\r?\n/g, '\r\n')}${color ? '\x1b[0m' : ''}`);
}

/** 从参考 TerminalView story 迁移；每次挂载创建独立 Bash、CLI 配置和内存文件。 */
export function BrowserShellStory({ withWocli = true }: { withWocli?: boolean }) {
	const terminalRef = useRef<TerminalViewHandle>(null);
	const bashRef = useRef<Bash | null>(null);
	const cwdRef = useRef(workspace);
	const envRef = useRef<Record<string, string> | undefined>(undefined);
	const inputRef = useRef('');
	const cursorRef = useRef(0);
	const historyRef = useRef<string[]>([]);
	const historyIndexRef = useRef(0);
	const busyRef = useRef(false);
	const abortControllerRef = useRef<AbortController | null>(null);
	const mountedRef = useRef(false);
	const shellGenerationRef = useRef(0);
	const [size, setSize] = useState({ cols: 0, rows: 0 });
	const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'error'>('loading');
	const [lastOutput, setLastOutput] = useState('');

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			shellGenerationRef.current += 1;
			abortControllerRef.current?.abort();
			abortControllerRef.current = null;
			bashRef.current = null;
			busyRef.current = false;
		};
	}, []);
	const writePrompt = useCallback(
		(terminal = terminalRef.current?.terminal) => terminal?.write(prompt(cwdRef.current)),
		[],
	);
	const redrawInput = useCallback((terminal: Terminal) => {
		terminal.write(renderTerminalInput(inputRef.current, cursorRef.current, prompt(cwdRef.current)));
	}, []);
	const setInput = useCallback(
		(terminal: Terminal, value: string, cursor = value.length) => {
			inputRef.current = value;
			cursorRef.current = normalizeTerminalCursor(value, cursor);
			redrawInput(terminal);
		},
		[redrawInput],
	);
	const executeCommand = useCallback(
		async (command: string) => {
			const terminal = terminalRef.current?.terminal;
			const bash = bashRef.current;
			if (!terminal || !bash || busyRef.current) return;
			const shellGeneration = shellGenerationRef.current;
			const trimmed = command.trim();
			if (!trimmed) {
				writePrompt(terminal);
				return;
			}
			if (trimmed === 'clear') {
				terminal.clear();
				terminal.write('\x1b[2J\x1b[H');
				writePrompt(terminal);
				return;
			}
			if (historyRef.current.at(-1) !== trimmed) historyRef.current.push(trimmed);
			historyIndexRef.current = historyRef.current.length;
			busyRef.current = true;
			setStatus('running');
			const abortController = new AbortController();
			abortControllerRef.current = abortController;
			try {
				const result = await bash.exec(command, {
					cwd: cwdRef.current,
					env: envRef.current,
					signal: abortController.signal,
				});
				if (terminalRef.current?.terminal !== terminal) return;
				cwdRef.current = result.env.PWD ?? cwdRef.current;
				envRef.current = result.env;
				writeShellOutput(terminal, result.stdout);
				writeShellOutput(terminal, result.stderr, '\x1b[31m');
				setLastOutput(result.stdout || result.stderr || `exit ${result.exitCode}`);
				if (result.exitCode !== 0) terminal.write(`\x1b[90m[exit ${result.exitCode}]\x1b[0m\r\n`);
			} catch (cause: unknown) {
				if (terminalRef.current?.terminal !== terminal) return;
				const message = cause instanceof Error ? cause.message : String(cause);
				writeShellOutput(terminal, message, '\x1b[31m');
				setLastOutput(message);
			} finally {
				if (abortControllerRef.current === abortController) {
					abortControllerRef.current = null;
					busyRef.current = false;
				}
				if (
					mountedRef.current &&
					shellGenerationRef.current === shellGeneration &&
					terminalRef.current?.terminal === terminal
				) {
					setStatus('ready');
					writePrompt(terminal);
				}
			}
		},
		[writePrompt],
	);
	const handleData = useCallback<NonNullable<TerminalViewProps['onData']>>(
		(data, terminal) => {
			if (data === '\u0003') {
				terminal.write('^C\r\n');
				inputRef.current = '';
				cursorRef.current = 0;
				if (busyRef.current) abortControllerRef.current?.abort();
				else writePrompt(terminal);
				return;
			}
			if (busyRef.current || !bashRef.current) return;
			if (data === '\r') {
				const command = inputRef.current;
				inputRef.current = '';
				cursorRef.current = 0;
				terminal.write('\r\n');
				void executeCommand(command);
				return;
			}
			if (data === '\u007f') {
				if (cursorRef.current <= 0) return;
				const input = inputRef.current;
				const cursor = cursorRef.current;
				const next = deleteTerminalBackward(input, cursor);
				if (cursor === input.length && isSimpleAsciiText(input)) {
					inputRef.current = next.input;
					cursorRef.current = next.cursor;
					terminal.write('\b \b');
				} else setInput(terminal, next.input, next.cursor);
				return;
			}
			if (data === '\u000c') {
				terminal.clear();
				terminal.write('\x1b[2J\x1b[H');
				redrawInput(terminal);
				return;
			}
			if (data === '\x01') {
				setInput(terminal, inputRef.current, 0);
				return;
			}
			if (data === '\x05') {
				setInput(terminal, inputRef.current);
				return;
			}
			if (data === '\x15') {
				setInput(terminal, inputRef.current.slice(cursorRef.current), 0);
				return;
			}
			if (data === '\x0b') {
				setInput(terminal, inputRef.current.slice(0, cursorRef.current), cursorRef.current);
				return;
			}
			if (data === '\x1b[A') {
				if (historyIndexRef.current > 0) historyIndexRef.current -= 1;
				setInput(terminal, historyRef.current[historyIndexRef.current] ?? '');
				return;
			}
			if (data === '\x1b[B') {
				if (historyIndexRef.current < historyRef.current.length) historyIndexRef.current += 1;
				setInput(terminal, historyRef.current[historyIndexRef.current] ?? '');
				return;
			}
			if (data === '\x1b[D') {
				if (cursorRef.current > 0) {
					cursorRef.current = moveTerminalCursor(inputRef.current, cursorRef.current, -1);
					redrawInput(terminal);
				}
				return;
			}
			if (data === '\x1b[C') {
				if (cursorRef.current < inputRef.current.length) {
					cursorRef.current = moveTerminalCursor(inputRef.current, cursorRef.current, 1);
					redrawInput(terminal);
				}
				return;
			}
			if (data === '\x1b[H' || data === '\x1b[1~') {
				setInput(terminal, inputRef.current, 0);
				return;
			}
			if (data === '\x1b[F' || data === '\x1b[4~') {
				setInput(terminal, inputRef.current);
				return;
			}
			if (data >= ' ' && !data.includes('\x1b')) {
				const input = inputRef.current;
				const cursor = cursorRef.current;
				const next = input.slice(0, cursor) + data + input.slice(cursor);
				if (cursor === input.length && isSimpleAsciiText(input) && isSimpleAsciiText(data)) {
					inputRef.current = next;
					cursorRef.current += data.length;
					terminal.write(data);
				} else setInput(terminal, next, cursor + data.length);
			}
		},
		[executeCommand, redrawInput, setInput, writePrompt],
	);
	const initializeShell = useCallback(
		async (terminal: Terminal) => {
			const generation = ++shellGenerationRef.current;
			terminal.writeln(`\x1b[1;36m${withWocli ? 'wocli' : 'just-bash'} shell\x1b[0m`);
			try {
				const { Bash } = await import('just-bash/browser');
				const customCommands = withWocli
					? [
							(await import('wocli/shell')).createWocliShellCommand({
								config: (await import('wocli/web')).createMemoryCliConfigStore({
									services: [{ name: 'system', type: 'system' }],
									defaults: { system: 'system' },
								}),
							}),
						]
					: [];
				if (terminalRef.current?.terminal !== terminal || generation !== shellGenerationRef.current) return;
				bashRef.current = new Bash({
					cwd: workspace,
					customCommands,
					env: { HOME: workspace, LOGNAME: 'storybook', SHELL: '/bin/bash', TERM: 'xterm-256color', USER: 'storybook' },
					files: {
						'/workspace/README.md': '# Browser shell\n\nTry: ls -la, cat README.md, echo hello | tr a-z A-Z\n',
						'/workspace/input.json': '{"text":"from virtual file"}\n',
					},
					executionLimitProfile: 'hardened',
					executionLimits: {
						maxCallDepth: 32,
						maxCommandCount: 500,
						maxExecutionTimeMs: 10000,
						maxFileSystemBytes: 16 * mebibyte,
						maxInputBytes: mebibyte,
						maxLiveBytes: 16 * mebibyte,
						maxLoopIterations: 10000,
						maxOutputSize: mebibyte,
						maxSourceBytes: 64 * 1024,
						maxStringLength: mebibyte,
					},
				});
				cwdRef.current = workspace;
				envRef.current = undefined;
				setStatus('ready');
				terminal.writeln('\x1b[32m✓ ready\x1b[0m');
				terminal.writeln(
					withWocli
						? '试试：wocli --help、wocli system info --json、ls -la'
						: '试试：ls -la、cat README.md、echo hello | tr a-z A-Z',
				);
				terminal.writeln('');
				writePrompt(terminal);
				terminal.focus();
			} catch (cause: unknown) {
				if (terminalRef.current?.terminal !== terminal) return;
				setStatus('error');
				writeShellOutput(terminal, cause instanceof Error ? cause.message : String(cause), '\x1b[31m');
			}
		},
		[withWocli, writePrompt],
	);
	const runPreset = useCallback(
		(command: string) => {
			const terminal = terminalRef.current?.terminal;
			if (!terminal || !bashRef.current || busyRef.current) return;
			inputRef.current = '';
			cursorRef.current = 0;
			terminal.write(`\r\x1b[2K${prompt(cwdRef.current)}${command}\r\n`);
			void executeCommand(command);
		},
		[executeCommand],
	);
	return (
		<div className='min-h-screen bg-[#07101f] p-4 sm:p-8'>
			<section
				aria-label={withWocli ? 'wocli shell' : 'Bash shell'}
				className='mx-auto max-w-5xl overflow-hidden rounded-xl border border-slate-700 bg-[#0b1020] text-slate-100'
			>
				<header className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 px-4 py-3'>
					<div>
						<h1 className='font-mono text-sm font-semibold'>{withWocli ? 'wocli' : 'just-bash'} · shell</h1>
						<p className='text-xs text-slate-300'>浏览器交互终端 · ↑↓ 历史 · Ctrl+C 取消 · Ctrl+L 清屏</p>
					</div>
					<div className='flex gap-3 font-mono text-xs'>
						<output aria-label='运行状态'>{status}</output>
						<output aria-label='终端尺寸'>
							{size.cols || '—'} × {size.rows || '—'}
						</output>
					</div>
				</header>
				<div className='h-[min(65vh,560px)] min-h-[360px]'>
					<TerminalView
						ref={terminalRef}
						aria-label='交互式 shell'
						onData={handleData}
						onError={() => setStatus('error')}
						onReady={initializeShell}
						onResize={setSize}
					/>
				</div>
				<footer className='flex flex-wrap gap-2 border-t border-slate-700 px-4 py-3'>
					<button className='btn btn-sm' type='button' onClick={() => terminalRef.current?.focus()}>
						聚焦
					</button>
					<button
						className='btn btn-sm'
						type='button'
						onClick={() => {
							const terminal = terminalRef.current?.terminal;
							if (!terminal) return;
							terminal.clear();
							terminal.write('\x1b[2J\x1b[H');
							redrawInput(terminal);
						}}
					>
						清屏
					</button>
					<button
						className='btn btn-sm'
						type='button'
						disabled={status !== 'ready'}
						onClick={() => runPreset('ls -la')}
					>
						列出文件
					</button>
					<button
						className='btn btn-sm'
						type='button'
						disabled={status !== 'ready'}
						onClick={() => runPreset("printf 'hello from shell\\n' > notes.txt && cat notes.txt")}
					>
						写入并读取文件
					</button>
					{withWocli && (
						<>
							<button
								className='btn btn-sm btn-info'
								type='button'
								disabled={status !== 'ready'}
								onClick={() => runPreset('wocli system info --json')}
							>
								运行 wocli
							</button>
							<button
								className='btn btn-sm btn-info'
								type='button'
								disabled={status !== 'ready'}
								onClick={() => runPreset('wocli system echo pipeline --json | cat')}
							>
								管道
							</button>
							<button
								className='btn btn-sm btn-info'
								type='button'
								disabled={status !== 'ready'}
								onClick={() => runPreset('wocli service call system echo --input @input.json --json')}
							>
								读取 JSON 文件
							</button>
						</>
					)}
				</footer>
			</section>
			<details className='mx-auto mt-4 max-w-5xl text-slate-200'>
				<summary className='cursor-pointer text-sm'>最近命令输出</summary>
				<pre
					data-testid='shell-last-output'
					className='mt-2 overflow-auto whitespace-pre-wrap rounded border border-slate-700 p-3 font-mono text-xs'
					aria-live='polite'
				>
					{lastOutput || '尚未执行命令'}
				</pre>
			</details>
		</div>
	);
}
