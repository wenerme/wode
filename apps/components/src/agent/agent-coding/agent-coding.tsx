'use client';

import { TerminalSquare } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { AgentWork, type AgentWorkProps, type AgentWorkTab } from '../agent-work';
import { AgentTerminal, type AgentTerminalMessages } from './agent-terminal';
import type { AgentActiveCommand, AgentTerminalEntry } from './command-types';

export type AgentCodingMessages = {
	terminalTab: string;
};

export const defaultAgentCodingMessages: AgentCodingMessages = {
	terminalTab: '终端',
};

export type AgentCodingProps = Omit<AgentWorkProps, 'extraWorkspaceTabs'> & {
	activeCommand?: AgentActiveCommand;
	command: string;
	entries: readonly AgentTerminalEntry[];
	extraWorkspaceTabs?: readonly AgentWorkTab[];
	messages?: AgentWorkProps['messages'] & Partial<AgentCodingMessages>;
	onCancelCommand?: (id: string) => void;
	onCommandChange: (command: string) => void;
	onRunCommand?: (command: string) => void;
	poisoned?: boolean;
	terminalMessages?: Partial<AgentTerminalMessages>;
	terminalProps?: Omit<ComponentPropsWithRef<'section'>, 'children'>;
};

export function AgentCoding({
	activeCommand,
	command,
	entries,
	extraWorkspaceTabs = [],
	messages,
	onCancelCommand,
	onCommandChange,
	onRunCommand,
	poisoned,
	terminalMessages,
	terminalProps,
	...workProps
}: AgentCodingProps) {
	const fileManagerProps = {
		...workProps.fileManagerProps,
		readOnly: poisoned || workProps.fileManagerProps?.readOnly,
	};
	const codingCopy = { ...defaultAgentCodingMessages, ...messages };
	const terminal = (
		<AgentTerminal
			{...terminalProps}
			activeCommand={activeCommand}
			command={command}
			entries={entries}
			messages={terminalMessages}
			poisoned={poisoned}
			onCancel={onCancelCommand}
			onCommandChange={onCommandChange}
			onRun={onRunCommand}
		/>
	);
	return (
		<AgentWork
			{...workProps}
			fileManagerProps={fileManagerProps}
			workspaceReadOnly={poisoned}
			extraWorkspaceTabs={[
				{
					id: 'terminal',
					label: (
						<span className='inline-flex items-center gap-1.5'>
							<TerminalSquare aria-hidden='true' className='size-4' />
							{codingCopy.terminalTab}
						</span>
					),
					panel: terminal,
				},
				...extraWorkspaceTabs,
			]}
			messages={messages}
		/>
	);
}
