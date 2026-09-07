'use client';

import type { Instructions, ToolSet } from 'ai';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AgentChat } from '../agent-chat';
import { AiSdkAgentChat } from './ai-sdk-agent-chat';
import type { OpenAICompatibleConnectionConfig, OpenAICompatibleConnectionDraft } from './connection-config';
import { validateOpenAICompatibleConnection } from './connection-config';
import { OpenAICompatibleConnectionEditor } from './connection-editor';
import type { OpenAICompatibleReasoningEffort } from './direct-transport';

export type AgentChatPlaygroundProps = ComponentPropsWithRef<'section'> & {
	connectionAccessory?: ReactNode;
	defaultConnection?: OpenAICompatibleConnectionDraft;
	fetch?: typeof globalThis.fetch;
	instructions?: Instructions;
	maxSteps?: number;
	onConnectionDraftChange?: (draft: OpenAICompatibleConnectionDraft) => void;
	reasoning?: OpenAICompatibleReasoningEffort;
	tools?: ToolSet;
};

const blankConnection: OpenAICompatibleConnectionDraft = {
	apiKey: '',
	baseUrl: '',
	headers: {},
	model: '',
};

export function AgentChatPlayground({
	className,
	connectionAccessory,
	defaultConnection,
	fetch,
	instructions,
	maxSteps,
	onConnectionDraftChange,
	reasoning,
	tools,
	...props
}: AgentChatPlaygroundProps) {
	const [initial] = useState(() => createInitialConnection(defaultConnection));
	const [draft, setDraft] = useState<OpenAICompatibleConnectionDraft>(initial.draft);
	const [applied, setApplied] = useState<OpenAICompatibleConnectionConfig | undefined>(initial.applied);
	const [revision, setRevision] = useState(0);
	return (
		<section
			data-slot='agent-chat-playground'
			className={cn(
				'border-border bg-background flex size-full min-h-0 min-w-0 flex-col overflow-hidden rounded-md border',
				className,
			)}
			{...props}
		>
			<OpenAICompatibleConnectionEditor
				applied={Boolean(applied)}
				className='border-border shrink-0 border-b'
				draft={draft}
				fetch={fetch}
				revealIdentity={revision}
				onApply={(connection) => {
					setApplied({ ...connection, headers: connection.headers ? { ...connection.headers } : undefined });
					setRevision((value) => value + 1);
				}}
				onDraftChange={(next) => {
					setDraft(next);
					onConnectionDraftChange?.(next);
				}}
			/>
			{connectionAccessory !== undefined ? (
				<div
					data-slot='agent-chat-playground-connection-accessory'
					className='border-border bg-background flex min-h-10 shrink-0 items-center border-b px-3 py-1.5'
				>
					{connectionAccessory}
				</div>
			) : null}
			<div className='min-h-[24rem] flex-1'>
				{applied ? (
					<AiSdkAgentChat
						className='rounded-none border-0'
						connection={applied}
						connectionRevision={revision}
						connectionSlot={<span className='text-success text-xs whitespace-nowrap'>配置已应用</span>}
						fetch={fetch}
						header={<h2 className='truncate text-sm font-semibold'>对话</h2>}
						instructions={instructions}
						maxSteps={maxSteps}
						reasoning={reasoning}
						tools={tools}
					/>
				) : (
					<AgentChat
						className='rounded-none border-0'
						disabled
						emptyState='请先应用连接配置'
						files={[]}
						status='ready'
						text=''
						value={[]}
						onFilesChange={() => undefined}
						onSend={() => undefined}
						onTextChange={() => undefined}
					/>
				)}
			</div>
		</section>
	);
}

function createInitialConnection(defaultConnection?: OpenAICompatibleConnectionDraft): {
	applied?: OpenAICompatibleConnectionConfig;
	draft: OpenAICompatibleConnectionDraft;
} {
	const draft = cloneConnection(defaultConnection ?? blankConnection);
	const validation = validateOpenAICompatibleConnection(draft);
	return { applied: validation.success ? validation.value : undefined, draft };
}

function cloneConnection(connection: OpenAICompatibleConnectionDraft): OpenAICompatibleConnectionDraft {
	return { ...connection, headers: connection.headers ? { ...connection.headers } : {} };
}
