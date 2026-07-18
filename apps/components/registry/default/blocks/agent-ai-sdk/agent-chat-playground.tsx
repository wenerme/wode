'use client';

import type { Instructions, ToolSet } from 'ai';
import type { ComponentPropsWithRef } from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AgentChat } from '../agent-chat';
import { AiSdkAgentChat } from './ai-sdk-agent-chat';
import type { OpenAICompatibleConnectionConfig, OpenAICompatibleConnectionDraft } from './connection-config';
import { OpenAICompatibleConnectionEditor } from './connection-editor';

export type AgentChatPlaygroundProps = ComponentPropsWithRef<'section'> & {
	fetch?: typeof globalThis.fetch;
	instructions?: Instructions;
	maxSteps?: number;
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
	fetch,
	instructions,
	maxSteps,
	tools,
	...props
}: AgentChatPlaygroundProps) {
	const [draft, setDraft] = useState<OpenAICompatibleConnectionDraft>(() => ({ ...blankConnection }));
	const [applied, setApplied] = useState<OpenAICompatibleConnectionConfig>();
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
				onDraftChange={setDraft}
			/>
			<div className='min-h-[24rem] flex-1'>
				{applied ? (
					<AiSdkAgentChat
						className='rounded-none border-0'
						connection={applied}
						connectionRevision={revision}
						connectionSlot={<span className='status status-success text-xs'>配置已应用</span>}
						fetch={fetch}
						header={<h2 className='truncate text-sm font-semibold'>对话</h2>}
						instructions={instructions}
						maxSteps={maxSteps}
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
