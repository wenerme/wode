'use client';

import type { UIMessage } from 'ai';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from '../message';
import { AgentMessagePartPresenter } from './agent-message-parts';
import type {
	AgentMessageMessages,
	AgentMessagePartRenderer,
	AgentMessageReasoningLabel,
	AgentMessageTextRenderer,
} from './agent-message-types';
import { resolveAgentMessageMessages } from './agent-message-types';
import { readAgentMessageString, readAgentMessageValue } from './agent-message-value';

export type AgentMessageProps = Omit<ComponentPropsWithRef<typeof Message>, 'align' | 'children'> & {
	actions?: ReactNode;
	avatar?: ReactNode;
	header?: ReactNode;
	message: UIMessage;
	messages?: Partial<AgentMessageMessages>;
	meta?: ReactNode;
	reasoningLabel?: AgentMessageReasoningLabel;
	renderPart?: AgentMessagePartRenderer;
	renderTool?: AgentMessagePartRenderer;
	showHeader?: boolean;
	textRenderer?: AgentMessageTextRenderer;
	usage?: ReactNode;
};

export function AgentMessage({
	actions,
	avatar,
	className,
	header,
	message,
	messages,
	meta,
	reasoningLabel,
	renderPart,
	renderTool,
	showHeader = true,
	textRenderer,
	usage,
	...props
}: AgentMessageProps) {
	const copy = resolveAgentMessageMessages(messages);
	const role = resolveRole(message.role);
	const rawParts: unknown[] = Array.isArray(message.parts) ? message.parts : [message.parts];
	let step = 0;
	return (
		<Message
			align={role === 'user' ? 'end' : 'start'}
			data-role={role}
			data-slot='agent-message'
			className={cn('py-1', className)}
			{...props}
		>
			{avatar !== undefined ? <MessageAvatar>{avatar}</MessageAvatar> : null}
			<MessageContent>
				{showHeader ? <MessageHeader>{header ?? roleLabel(role, copy)}</MessageHeader> : null}
				{rawParts.map((part, index) => {
					if (readAgentMessageString(part, 'type') === 'step-start') step += 1;
					const context = { index, message, part: part as UIMessage['parts'][number], step };
					const key = messagePartKey(message.id, index, part);
					const custom = renderPart?.(context);
					if (custom !== undefined) return <AgentMessageCustomPart key={key}>{custom}</AgentMessageCustomPart>;
					const type = readAgentMessageString(part, 'type');
					if (type === 'dynamic-tool' || type?.startsWith('tool-')) {
						const customTool = renderTool?.(context);
						if (customTool !== undefined) {
							return <AgentMessageCustomPart key={key}>{customTool}</AgentMessageCustomPart>;
						}
					}
					return (
						<AgentMessagePartPresenter
							key={key}
							index={index}
							message={message}
							messages={copy}
							part={part}
							reasoningLabel={reasoningLabel}
							role={role}
							step={step}
							textRenderer={textRenderer}
						/>
					);
				})}
				{actions !== undefined || usage !== undefined || meta !== undefined ? (
					<MessageFooter>
						{meta !== undefined ? <AgentMessageMeta>{meta}</AgentMessageMeta> : null}
						{usage !== undefined ? <AgentMessageUsage>{usage}</AgentMessageUsage> : null}
						{actions !== undefined ? <AgentMessageActions>{actions}</AgentMessageActions> : null}
					</MessageFooter>
				) : null}
			</MessageContent>
		</Message>
	);
}

export type AgentMessageActionsProps = ComponentPropsWithRef<'div'>;

export function AgentMessageActions({ className, ...props }: AgentMessageActionsProps) {
	return (
		<div data-slot='agent-message-actions' className={cn('flex min-h-8 items-center gap-1', className)} {...props} />
	);
}

export type AgentMessageUsageProps = ComponentPropsWithRef<'span'>;

export function AgentMessageUsage({ className, ...props }: AgentMessageUsageProps) {
	return <span data-slot='agent-message-usage' className={cn('whitespace-nowrap', className)} {...props} />;
}

export type AgentMessageMetaProps = ComponentPropsWithRef<'span'>;

export function AgentMessageMeta({ className, ...props }: AgentMessageMetaProps) {
	return <span data-slot='agent-message-meta' className={cn('min-w-0 truncate', className)} {...props} />;
}

function AgentMessageCustomPart({ children }: { children: ReactNode }) {
	return (
		<div data-slot='agent-message-part' data-part-type='custom-renderer'>
			{children}
		</div>
	);
}

function messagePartKey(messageId: string, index: number, part: unknown): string {
	const approvalId = readAgentMessageString(readAgentMessageValue(part, 'approval'), 'id');
	const toolCallId = readAgentMessageString(part, 'toolCallId');
	return `${messageId}-${index}-${approvalId ?? toolCallId ?? ''}`;
}

function resolveRole(role: unknown): UIMessage['role'] {
	return role === 'user' || role === 'system' || role === 'assistant' ? role : 'assistant';
}

function roleLabel(role: UIMessage['role'], messages: AgentMessageMessages) {
	if (role === 'user') return messages.userRole;
	if (role === 'system') return messages.systemRole;
	return messages.assistantRole;
}
