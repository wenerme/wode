'use client';

import { Check, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { AiSdkAgentToolRenderContext } from '../agent-ai-sdk';

export type AgentPlaygroundApprovalMessages = {
	approve: string;
	deny: string;
	failed: string;
	pending: string;
	responded: string;
	title: string;
};

export const defaultAgentPlaygroundApprovalMessages: AgentPlaygroundApprovalMessages = {
	approve: '批准',
	deny: '拒绝',
	failed: '提交审批失败，请重试。',
	pending: '正在提交审批…',
	responded: '审批已提交',
	title: '工具执行审批',
};

export function AgentPlaygroundApproval({
	context,
	messages,
}: {
	context: AiSdkAgentToolRenderContext;
	messages?: Partial<AgentPlaygroundApprovalMessages>;
}) {
	const part = readRecord(context.part);
	const approval = readRecord(part?.approval);
	const id = typeof approval?.id === 'string' ? approval.id : undefined;
	const state = typeof part?.state === 'string' ? part.state : undefined;
	const name = typeof part?.type === 'string' ? part.type.replace(/^tool-/u, '') : 'tool';
	if (!id || (state !== 'approval-requested' && state !== 'approval-responded')) return null;
	return (
		<AgentPlaygroundApprovalRequest
			key={id}
			context={context}
			id={id}
			input={part?.input}
			messages={messages}
			name={name}
		/>
	);
}

function AgentPlaygroundApprovalRequest({
	context,
	id,
	input,
	messages,
	name,
}: {
	context: AiSdkAgentToolRenderContext;
	id: string;
	input: unknown;
	messages?: Partial<AgentPlaygroundApprovalMessages>;
	name: string;
}) {
	const copy = { ...defaultAgentPlaygroundApprovalMessages, ...messages };
	const submitted = useRef(false);
	const [pending, setPending] = useState(false);
	const [responded, setResponded] = useState(false);
	const [error, setError] = useState(false);
	const respond = async (approved: boolean) => {
		if (submitted.current || pending || responded) return;
		submitted.current = true;
		setPending(true);
		setError(false);
		try {
			await context.respondToApproval({ approved, id, reason: approved ? undefined : '用户拒绝' });
			setResponded(true);
		} catch {
			submitted.current = false;
			setError(true);
		} finally {
			setPending(false);
		}
	};
	return (
		<section
			data-slot='agent-playground-approval'
			data-approval-id={id}
			className='border-border w-full max-w-2xl rounded-md border'
		>
			<header className='border-border flex min-h-10 items-center gap-2 border-b px-3 py-2'>
				<h3 className='min-w-0 flex-1 truncate text-sm font-semibold'>
					{copy.title}：{name}
				</h3>
				<span className='badge badge-warning badge-sm'>
					{responded ? copy.responded : copy.pending.replace('正在提交', '等待')}
				</span>
			</header>
			{input !== undefined ? (
				<pre className='bg-muted m-3 max-h-48 overflow-auto rounded-sm p-2 text-xs whitespace-pre-wrap'>
					{safeJson(input)}
				</pre>
			) : null}
			<div className='border-border flex flex-wrap items-center justify-end gap-2 border-t px-3 py-2'>
				{pending ? <output className='text-muted-foreground mr-auto text-xs'>{copy.pending}</output> : null}
				{error ? (
					<span role='alert' className='text-error mr-auto text-xs'>
						{copy.failed}
					</span>
				) : null}
				<button
					type='button'
					className='btn btn-ghost btn-sm'
					disabled={pending || responded}
					onClick={() => void respond(false)}
				>
					<X aria-hidden='true' className='size-4' />
					{copy.deny}
				</button>
				<button
					type='button'
					className='btn btn-primary btn-sm'
					disabled={pending || responded}
					onClick={() => void respond(true)}
				>
					<Check aria-hidden='true' className='size-4' />
					{copy.approve}
				</button>
			</div>
		</section>
	);
}

export function renderAgentPlaygroundApproval(
	context: AiSdkAgentToolRenderContext,
	messages?: Partial<AgentPlaygroundApprovalMessages>,
) {
	const part = readRecord(context.part);
	return part?.state === 'approval-requested' || part?.state === 'approval-responded' ? (
		<AgentPlaygroundApproval context={context} messages={messages} />
	) : undefined;
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

function safeJson(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2).slice(0, 16 * 1024);
	} catch {
		return '[无法显示输入]';
	}
}
