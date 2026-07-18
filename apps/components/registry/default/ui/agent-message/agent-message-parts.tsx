'use client';

import { ExternalLink, FileText, Image as ImageIcon, Music2, Wrench } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AgentMessageDefaultTextRenderer } from './agent-markdown';
import type {
	AgentMessageMessages,
	AgentMessagePart,
	AgentMessageReasoningLabel,
	AgentMessageTextRenderer,
} from './agent-message-types';
import {
	formatAgentMessageValue,
	isAgentMessageRecord,
	readAgentMessageString,
	readAgentMessageValue,
	resolveAgentMessageHref,
} from './agent-message-value';

export type AgentMessagePartPresenterProps = Omit<ComponentPropsWithRef<'div'>, 'part'> & {
	index: number;
	message: import('ai').UIMessage;
	messages: AgentMessageMessages;
	part: unknown;
	reasoningLabel?: AgentMessageReasoningLabel;
	role: import('ai').UIMessage['role'];
	step: number;
	textRenderer?: AgentMessageTextRenderer;
};

export function AgentMessagePartPresenter({
	className,
	index,
	message,
	messages,
	part,
	reasoningLabel,
	role,
	step,
	textRenderer: TextRenderer = AgentMessageDefaultTextRenderer,
	...props
}: AgentMessagePartPresenterProps) {
	const type = readAgentMessageString(part, 'type');
	let content: ReactNode;

	if (!type) {
		content = <AgentMessagePartFallback label={messages.malformedPart} />;
	} else if (type === 'text') {
		const text = readAgentMessageString(part, 'text');
		content =
			text === undefined ? (
				<AgentMessagePartFallback label={messages.malformedPart} />
			) : (
				<TextRenderer
					message={message}
					part={part as AgentMessagePart}
					streaming={readAgentMessageString(part, 'state') === 'streaming'}
					text={text}
				/>
			);
	} else if (type === 'reasoning') {
		content = renderReasoning({ message, messages, part, reasoningLabel, TextRenderer });
	} else if (type === 'file' || type === 'reasoning-file') {
		content = <AgentMessageFile messages={messages} part={part} />;
	} else if (type === 'source-url' || type === 'source-document') {
		content = <AgentMessageSource messages={messages} part={part} type={type} />;
	} else if (type === 'step-start') {
		content = <AgentMessageStep label={messages.step(step)} />;
	} else if (type === 'dynamic-tool' || type.startsWith('tool-')) {
		content = <AgentMessageTool messages={messages} part={part} type={type} />;
	} else {
		content = <AgentMessagePartFallback label={messages.unknownPart(type)} />;
	}

	return (
		<div
			data-slot='agent-message-part'
			data-part-index={index}
			data-part-type={type ?? 'malformed'}
			data-role={role}
			className={cn(
				'max-w-full min-w-0',
				role === 'user' &&
					type === 'text' &&
					'bg-primary text-primary-foreground w-fit max-w-[min(42rem,90%)] rounded-md px-3 py-2',
				role === 'system' && 'border-info bg-info/10 w-full border-l-2 px-3 py-2',
				className,
			)}
			{...props}
		>
			{content}
		</div>
	);
}

function renderReasoning({
	message,
	messages,
	part,
	reasoningLabel,
	TextRenderer,
}: {
	message: import('ai').UIMessage;
	messages: AgentMessageMessages;
	part: unknown;
	reasoningLabel?: AgentMessageReasoningLabel;
	TextRenderer: AgentMessageTextRenderer;
}) {
	const text = readAgentMessageString(part, 'text');
	if (text === undefined) return <AgentMessagePartFallback label={messages.malformedPart} />;
	const streaming = readAgentMessageString(part, 'state') === 'streaming';
	const label =
		reasoningLabel?.({ message, part: part as AgentMessagePart, streaming }) ??
		(streaming ? messages.reasoningStreaming : messages.reasoning);
	return (
		<details
			data-slot='agent-message-reasoning'
			open={streaming || undefined}
			className='border-border max-w-full border-l-2 pl-3'
		>
			<summary className='text-muted-foreground cursor-pointer text-xs font-medium'>{label}</summary>
			<div className='text-muted-foreground mt-2'>
				<TextRenderer message={message} part={part as AgentMessagePart} streaming={streaming} text={text} />
			</div>
		</details>
	);
}

function AgentMessageFile({ messages, part }: { messages: AgentMessageMessages; part: unknown }) {
	const mediaType = readAgentMessageString(part, 'mediaType') ?? '';
	const filename = readAgentMessageString(part, 'filename') ?? messages.unnamedAttachment;
	const url = resolveAgentMessageHref(readAgentMessageValue(part, 'url'), 'file');
	if (!url) return <AgentMessagePartFallback label={messages.malformedPart} />;

	if (mediaType === 'image' || mediaType.startsWith('image/')) {
		return (
			<figure data-slot='agent-message-attachment' data-media='image' className='w-fit max-w-full'>
				<img
					alt={`${messages.imageAttachment}：${filename}`}
					className='border-border max-h-80 w-auto max-w-full rounded-md border object-contain'
					height={240}
					loading='lazy'
					src={url}
					width={320}
				/>
				<figcaption className='text-muted-foreground mt-1 flex items-center gap-1 text-xs'>
					<ImageIcon aria-hidden='true' className='size-3.5' /> {filename}
				</figcaption>
			</figure>
		);
	}
	if (mediaType === 'audio' || mediaType.startsWith('audio/')) {
		return (
			<figure data-slot='agent-message-attachment' data-media='audio' className='max-w-full'>
				<figcaption className='text-muted-foreground mb-1 flex items-center gap-1 text-xs'>
					<Music2 aria-hidden='true' className='size-3.5' /> {filename}
				</figcaption>
				{/* biome-ignore lint/a11y/useMediaCaption: Provider attachments do not include a transcript track. */}
				<audio
					aria-label={`${messages.audioAttachment}：${filename}`}
					className='h-10 w-full max-w-md'
					controls
					preload='metadata'
					src={url}
				/>
			</figure>
		);
	}
	return (
		<a
			data-slot='agent-message-attachment'
			data-media='file'
			className='border-border hover:bg-muted flex min-h-9 w-fit max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm'
			download={filename}
			href={url}
		>
			<FileText aria-hidden='true' className='size-4 shrink-0' />
			<span className='truncate'>{filename}</span>
		</a>
	);
}

function AgentMessageSource({
	messages,
	part,
	type,
}: {
	messages: AgentMessageMessages;
	part: unknown;
	type: 'source-url' | 'source-document';
}) {
	const title =
		readAgentMessageString(part, 'title') ?? readAgentMessageString(part, 'filename') ?? messages.unnamedSource;
	if (type === 'source-document') {
		return (
			<span
				data-slot='agent-message-source'
				className='text-muted-foreground inline-flex min-h-7 max-w-full items-center gap-1.5 text-xs'
			>
				<FileText aria-hidden='true' className='size-3.5 shrink-0' />
				<span className='truncate'>
					{messages.documentSource}：{title}
				</span>
			</span>
		);
	}
	const url = resolveAgentMessageHref(readAgentMessageValue(part, 'url'), 'source');
	if (!url) return <AgentMessagePartFallback label={messages.malformedPart} />;
	return (
		<a
			data-slot='agent-message-source'
			className='text-primary inline-flex min-h-7 max-w-full items-center gap-1.5 text-xs underline underline-offset-4'
			href={url}
			rel='noreferrer'
			target='_blank'
			title={messages.openSource}
		>
			<ExternalLink aria-hidden='true' className='size-3.5 shrink-0' />
			<span className='truncate'>{title}</span>
		</a>
	);
}

function AgentMessageStep({ label }: { label: string }) {
	return (
		<div data-slot='agent-message-step' className='text-muted-foreground flex min-h-6 items-center gap-2 text-xs'>
			<span className='border-border h-px flex-1 border-t' />
			<span>{label}</span>
			<span className='border-border h-px flex-1 border-t' />
		</div>
	);
}

function AgentMessageTool({ messages, part, type }: { messages: AgentMessageMessages; part: unknown; type: string }) {
	const state = readAgentMessageString(part, 'state') ?? 'unknown';
	const toolName = type === 'dynamic-tool' ? readAgentMessageString(part, 'toolName') : type.slice('tool-'.length);
	const title = readAgentMessageString(part, 'title') ?? toolName ?? messages.unnamedTool;
	const approval = readAgentMessageValue(part, 'approval');
	const approved =
		isAgentMessageRecord(approval) && typeof readAgentMessageValue(approval, 'approved') === 'boolean'
			? (readAgentMessageValue(approval, 'approved') as boolean)
			: undefined;
	const input = readAgentMessageValue(part, 'input');
	const output = readAgentMessageValue(part, 'output');
	const error = readAgentMessageString(part, 'errorText');
	const reason = isAgentMessageRecord(approval) ? readAgentMessageString(approval, 'reason') : undefined;
	return (
		<details
			data-slot='agent-message-tool'
			data-state={state}
			open={state === 'approval-requested' || state === 'output-error' || undefined}
			className='border-border w-full max-w-2xl rounded-md border'
		>
			<summary className='hover:bg-muted flex min-h-10 cursor-pointer list-none items-center gap-2 px-3 py-2'>
				<Wrench aria-hidden='true' className='text-muted-foreground size-4 shrink-0' />
				<span className='min-w-0 flex-1 truncate text-sm font-medium'>{title}</span>
				<span className='badge badge-ghost badge-sm shrink-0'>{messages.toolState(state, approved)}</span>
			</summary>
			<div className='border-border space-y-3 border-t px-3 py-2 text-xs'>
				{input !== undefined ? <AgentMessageToolValue label={messages.toolInput} value={input} /> : null}
				{output !== undefined ? <AgentMessageToolValue label={messages.toolOutput} value={output} /> : null}
				{error ? <AgentMessageToolValue error label={messages.toolOutput} value={error} /> : null}
				{reason ? <AgentMessageToolValue label={messages.toolApprovalReason} value={reason} /> : null}
			</div>
		</details>
	);
}

function AgentMessageToolValue({ error = false, label, value }: { error?: boolean; label: string; value: unknown }) {
	return (
		<div>
			<div className='text-muted-foreground mb-1 font-medium'>{label}</div>
			<pre
				className={cn(
					'bg-muted max-h-64 overflow-auto rounded-sm p-2 whitespace-pre-wrap',
					error && 'bg-error/10 text-error',
				)}
			>
				{formatAgentMessageValue(value)}
			</pre>
		</div>
	);
}

function AgentMessagePartFallback({ label }: { label: string }) {
	return (
		<div
			data-slot='agent-message-part-fallback'
			role='status'
			className='text-muted-foreground border-border rounded-sm border border-dashed px-2.5 py-2 text-xs'
		>
			{label}
		</div>
	);
}
