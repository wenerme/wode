'use client';

import type { FitAddon } from '@xterm/addon-fit';
import type { ITerminalInitOnlyOptions, ITerminalOptions, ITheme, Terminal } from '@xterm/xterm';
import {
	type ComponentPropsWithoutRef,
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';
import { executeTerminalCommands, type TerminalCommand } from './input';
import { resolveTerminalKeybinding, type TerminalKeyboardOptions } from './TerminalKeybinding';

let terminalDependenciesPromise: Promise<{
	Terminal: typeof import('@xterm/xterm').Terminal;
	FitAddon: typeof import('@xterm/addon-fit').FitAddon;
}> | null = null;
async function loadTerminalDependencies() {
	if (!terminalDependenciesPromise) {
		const loadingPromise = Promise.all([
			import('@xterm/xterm'),
			import('@xterm/addon-fit'),
			import('@xterm/xterm/css/xterm.css'),
		]).then(([terminalModule, fitAddonModule]) => ({
			Terminal: terminalModule.Terminal,
			FitAddon: fitAddonModule.FitAddon,
		}));
		terminalDependenciesPromise = loadingPromise.catch((error: unknown) => {
			terminalDependenciesPromise = null;
			throw error;
		});
	}
	return terminalDependenciesPromise;
}
function normalizeError(cause: unknown) {
	return cause instanceof Error ? cause : new Error(String(cause));
}

export const DefaultTerminalTheme: Readonly<ITheme> = Object.freeze({
	background: '#0b1020',
	foreground: '#dbe4ff',
	cursor: '#93c5fd',
	selectionBackground: '#33415599',
	black: '#111827',
	red: '#f87171',
	green: '#4ade80',
	yellow: '#facc15',
	blue: '#60a5fa',
	magenta: '#c084fc',
	cyan: '#22d3ee',
	white: '#e5e7eb',
	brightBlack: '#6b7280',
	brightRed: '#fca5a5',
	brightGreen: '#86efac',
	brightYellow: '#fde047',
	brightBlue: '#93c5fd',
	brightMagenta: '#d8b4fe',
	brightCyan: '#67e8f9',
	brightWhite: '#f8fafc',
});
export interface TerminalSize {
	cols: number;
	rows: number;
}
export interface TerminalViewHandle {
	readonly terminal: Terminal | null;
	fit(): void;
	focus(): void;
	write(data: string | Uint8Array): void;
	writeln(data?: string): void;
	clear(): void;
	reset(): void;
	executeCommands(commands: TerminalCommand | readonly TerminalCommand[]): boolean;
}
export interface TerminalViewProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onError' | 'onResize'> {
	autoFit?: boolean;
	initialOptions?: ITerminalOptions & ITerminalInitOnlyOptions;
	theme?: ITheme;
	keyboard?: TerminalKeyboardOptions | false;
	onData?: (data: string, terminal: Terminal) => void;
	onResize?: (size: TerminalSize, terminal: Terminal) => void;
	onBeforeResize?: (size: TerminalSize) => void | Promise<void>;
	onReady?: (terminal: Terminal) => void;
	onError?: (error: Error) => void;
}

export const TerminalView = forwardRef<TerminalViewHandle, TerminalViewProps>(function TerminalView(
	{
		autoFit = true,
		className = 'h-full min-h-0 w-full overflow-hidden bg-[#0b1020] p-2',
		onData,
		onError,
		onReady,
		onResize,
		onBeforeResize,
		initialOptions,
		style,
		theme,
		keyboard,
		...containerProps
	},
	forwardedRef,
) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const terminalRef = useRef<Terminal | null>(null);
	const fitAddonRef = useRef<FitAddon | null>(null);
	const fitFrameRef = useRef<number | null>(null);
	const fitTaskRef = useRef<Promise<void> | null>(null);
	const callbacksRef = useRef({ onData, onError, onReady, onResize, onBeforeResize });
	const settingsRef = useRef({ autoFit, initialOptions, theme, keyboard });
	const initialThemeRef = useRef<ITheme | undefined>(undefined);
	const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
	callbacksRef.current = { onData, onError, onReady, onResize, onBeforeResize };
	settingsRef.current = { autoFit, initialOptions, theme, keyboard };
	const executeCommands = useCallback((commands: TerminalCommand | readonly TerminalCommand[]) => {
		const terminal = terminalRef.current;
		if (!terminal) return false;
		const actions = Array.isArray(commands) ? commands : [commands as TerminalCommand];
		if (terminal.options.disableStdin && actions.some((action) => action.type === 'input' || action.type === 'key'))
			return false;
		executeTerminalCommands(
			{
				input: (data) => terminal.input(data, true),
				focus: () => terminal.focus(),
				scrollToBottom: () => terminal.scrollToBottom(),
			},
			actions,
		);
		return true;
	}, []);
	const fitToContainer = useCallback(function fitContainer() {
		const container = containerRef.current;
		const fitAddon = fitAddonRef.current;
		const terminal = terminalRef.current;
		if (!container || !fitAddon || !terminal || container.clientWidth === 0 || container.clientHeight === 0) return;
		if (!callbacksRef.current.onBeforeResize) {
			fitAddon.fit();
			return;
		}
		if (fitTaskRef.current) return;
		const size = fitAddon.proposeDimensions();
		if (!size || (size.cols === terminal.cols && size.rows === terminal.rows)) return;
		try {
			const barrier = callbacksRef.current.onBeforeResize(size);
			if (!barrier) {
				terminal.resize(size.cols, size.rows);
				return;
			}
			let failed = false;
			const task = Promise.resolve(barrier)
				.then(() => {
					if (terminalRef.current === terminal) terminal.resize(size.cols, size.rows);
				})
				.catch((cause: unknown) => {
					failed = true;
					if (terminalRef.current === terminal) callbacksRef.current.onError?.(normalizeError(cause));
				})
				.finally(() => {
					if (fitTaskRef.current !== task) return;
					fitTaskRef.current = null;
					if (!failed) fitContainer();
				});
			fitTaskRef.current = task;
		} catch (cause: unknown) {
			callbacksRef.current.onError?.(normalizeError(cause));
		}
	}, []);
	const scheduleFit = useCallback(() => {
		if (fitFrameRef.current !== null) cancelAnimationFrame(fitFrameRef.current);
		fitFrameRef.current = requestAnimationFrame(() => {
			fitFrameRef.current = null;
			fitToContainer();
		});
	}, [fitToContainer]);
	useImperativeHandle(
		forwardedRef,
		() => ({
			get terminal() {
				return terminalRef.current;
			},
			fit: fitToContainer,
			focus: () => terminalRef.current?.focus(),
			write: (data) => terminalRef.current?.write(data),
			writeln: (data = '') => terminalRef.current?.writeln(data),
			clear: () => terminalRef.current?.clear(),
			reset: () => terminalRef.current?.reset(),
			executeCommands,
		}),
		[fitToContainer, executeCommands],
	);
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		let disposed = false;
		let resourcesDisposed = false;
		let resizeObserver: ResizeObserver | null = null;
		let removeWindowResizeListener: (() => void) | null = null;
		let activeTerminal: Terminal | null = null;
		const disposables: Array<{ dispose(): void }> = [];
		const disposeResources = () => {
			if (resourcesDisposed) return;
			resourcesDisposed = true;
			if (fitFrameRef.current !== null) cancelAnimationFrame(fitFrameRef.current);
			fitFrameRef.current = null;
			fitTaskRef.current = null;
			resizeObserver?.disconnect();
			removeWindowResizeListener?.();
			for (const disposable of disposables) disposable.dispose();
			activeTerminal?.dispose();
			activeTerminal = null;
			terminalRef.current = null;
			fitAddonRef.current = null;
			initialThemeRef.current = undefined;
		};
		const initializeTerminal = async () => {
			try {
				const { Terminal, FitAddon } = await loadTerminalDependencies();
				if (disposed) return null;
				const currentSettings = settingsRef.current;
				const terminal = new Terminal({
					convertEol: true,
					cursorBlink: true,
					fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
					fontSize: 13,
					scrollback: 4000,
					...currentSettings.initialOptions,
					theme: { ...DefaultTerminalTheme, ...currentSettings.initialOptions?.theme, ...currentSettings.theme },
				});
				activeTerminal = terminal;
				const fitAddon = new FitAddon();
				terminal.loadAddon(fitAddon);
				terminal.open(container);
				terminalRef.current = terminal;
				fitAddonRef.current = fitAddon;
				initialThemeRef.current = currentSettings.initialOptions?.theme;
				terminal.attachCustomKeyEventHandler((event) => {
					const options = settingsRef.current.keyboard;
					if (disposed || !options || terminal.options.disableStdin) return true;
					const binding = resolveTerminalKeybinding(event, options);
					if (!binding || binding.commands === null) return true;
					event.preventDefault();
					event.stopPropagation();
					if (!event.repeat || binding.repeat !== false) executeCommands(binding.commands);
					return false;
				});
				disposables.push(
					terminal.onData((data) => callbacksRef.current.onData?.(data, terminal)),
					terminal.onResize((size) => callbacksRef.current.onResize?.(size, terminal)),
				);
				if (typeof ResizeObserver === 'function') {
					resizeObserver = new ResizeObserver(() => {
						if (settingsRef.current.autoFit) scheduleFit();
					});
					resizeObserver.observe(container);
				} else {
					const handleWindowResize = () => {
						if (settingsRef.current.autoFit) scheduleFit();
					};
					window.addEventListener('resize', handleWindowResize);
					removeWindowResizeListener = () => window.removeEventListener('resize', handleWindowResize);
				}
				if (currentSettings.autoFit) scheduleFit();
				return terminal;
			} catch (cause: unknown) {
				if (disposed) return null;
				disposeResources();
				setState('error');
				callbacksRef.current.onError?.(normalizeError(cause));
				return null;
			}
		};
		void initializeTerminal().then((terminal) => {
			if (!terminal || disposed) return;
			setState('ready');
			try {
				callbacksRef.current.onReady?.(terminal);
			} catch (cause: unknown) {
				callbacksRef.current.onError?.(normalizeError(cause));
			}
		});
		return () => {
			disposed = true;
			disposeResources();
		};
	}, [scheduleFit, executeCommands]);
	useEffect(() => {
		const terminal = terminalRef.current;
		if (!terminal) return;
		terminal.options.theme = { ...DefaultTerminalTheme, ...initialThemeRef.current, ...theme };
		if (autoFit) scheduleFit();
	}, [autoFit, scheduleFit, theme]);
	return (
		<div
			{...containerProps}
			ref={containerRef}
			className={className}
			data-state={state}
			data-testid='terminal-view'
			style={{ minWidth: 0, ...style }}
		/>
	);
});
