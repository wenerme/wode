'use client';

import { Play, Square } from 'lucide-react';
import type { ComponentPropsWithRef, FormEvent } from 'react';
import { cn } from '@/lib/utils';
import type { AgentActiveCommand, AgentTerminalEntry } from './command-types';

export type AgentTerminalMessages = {
	cancel: string;
	command: string;
	empty: string;
	exitCode: (code: number) => string;
	poisoned: string;
	run: string;
	truncated: string;
};

export const defaultAgentTerminalMessages: AgentTerminalMessages = {
	cancel: '取消命令',
	command: '命令',
	empty: '尚未运行命令。',
	exitCode: (code) => `退出码 ${code}`,
	poisoned: '执行器已污染，需替换运行时。',
	run: '运行命令',
	truncated: '输出已截断',
};

export type AgentTerminalProps = ComponentPropsWithRef<'section'> & {
	activeCommand?: AgentActiveCommand;
	command: string;
	entries: readonly AgentTerminalEntry[];
	messages?: Partial<AgentTerminalMessages>;
	onCancel?: (id: string) => void;
	onCommandChange: (command: string) => void;
	onRun?: (command: string) => void;
	poisoned?: boolean;
};

export function AgentTerminal({
	activeCommand,
	className,
	command,
	entries,
	messages,
	onCancel,
	onCommandChange,
	onRun,
	poisoned = false,
	...props
}: AgentTerminalProps) {
	const copy = { ...defaultAgentTerminalMessages, ...messages };
	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const value = command.trim();
		if (value && !activeCommand && !poisoned) onRun?.(value);
	};
	return (
		<section
			data-slot='agent-terminal'
			aria-label='终端'
			className={cn('bg-neutral text-neutral-content flex size-full min-h-0 flex-col', className)}
			{...props}
		>
			<form className='border-neutral-content/20 flex shrink-0 gap-2 border-b p-2' onSubmit={submit}>
				<label className='min-w-0 flex-1'>
					<span className='sr-only'>{copy.command}</span>
					<input
						aria-label={copy.command}
						className='input input-sm bg-neutral text-neutral-content border-neutral-content/25 w-full font-mono'
						disabled={Boolean(activeCommand) || poisoned}
						spellCheck={false}
						value={command}
						onChange={(event) => onCommandChange(event.currentTarget.value)}
					/>
				</label>
				{activeCommand ? (
					<button type='button' className='btn btn-error btn-sm' onClick={() => onCancel?.(activeCommand.id)}>
						<Square aria-hidden='true' className='size-3.5 fill-current' />
						{copy.cancel}
					</button>
				) : (
					<button type='submit' className='btn btn-primary btn-sm' disabled={!command.trim() || poisoned || !onRun}>
						<Play aria-hidden='true' className='size-4' />
						{copy.run}
					</button>
				)}
			</form>
			{poisoned ? (
				<div role='alert' className='bg-error/20 text-error-content px-3 py-2 text-xs'>
					{copy.poisoned}
				</div>
			) : null}
			<div className='min-h-0 flex-1 overflow-auto p-3 font-mono text-xs'>
				{entries.length === 0 ? <p className='text-neutral-content/55'>{copy.empty}</p> : null}
				{entries.map((entry) => (
					<TerminalEntryView key={entry.id} entry={entry} copy={copy} />
				))}
				{activeCommand && !entries.some((entry) => entry.id === activeCommand.id) ? (
					<pre className='mb-4 whitespace-pre-wrap'>
						<span className='text-success'>$</span> {activeCommand.command}
						{'\n'}运行中…
					</pre>
				) : null}
			</div>
		</section>
	);
}

function TerminalEntryView({ entry, copy }: { entry: AgentTerminalEntry; copy: AgentTerminalMessages }) {
	const result = entry.result;
	return (
		<pre
			data-terminal-entry={entry.id}
			className='border-neutral-content/15 mb-4 border-b pb-4 break-words whitespace-pre-wrap last:border-0'
		>
			<span className='text-success'>$</span> {entry.command}
			{'\n'}
			{result?.stdout ?? ''}
			{result?.stderr ? <span className='text-error'>{result.stderr}</span> : null}
			{result ? (
				<span className='text-neutral-content/55'>
					{'\n'}[{copy.exitCode(result.exitCode)} · {Math.round(result.durationMs)} ms
					{result.truncated ? ` · ${copy.truncated}` : ''}]
				</span>
			) : (
				<span className='text-neutral-content/55'>运行中…</span>
			)}
		</pre>
	);
}
