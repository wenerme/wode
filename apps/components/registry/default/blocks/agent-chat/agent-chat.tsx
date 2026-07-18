'use client';

import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AgentComposer, type AgentComposerStatus } from '../../ui/agent-composer';
import { AgentMessage } from '../../ui/agent-message';
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from '../../ui/message-scroller';
import type { AgentChatProps } from './agent-chat-types';
import { resolveAgentChatMessages } from './agent-chat-types';
import { validateAgentRuntimeMessages } from './runtime-message-validation';

export function AgentChat({
	autoScroll = true,
	className,
	composerProps,
	connection,
	disabled = false,
	emptyState,
	error,
	files,
	footer,
	header,
	messageProps,
	messages,
	model,
	onFilesChange,
	onRetry,
	onSend,
	onStop,
	onTextChange,
	renderMessage,
	renderPart,
	renderTool,
	status,
	text,
	toolbar,
	value,
	...props
}: AgentChatProps) {
	const copy = resolveAgentChatMessages(messages);
	const messageValidation = validateAgentRuntimeMessages(value);
	const visibleMessages = messageValidation.success ? messageValidation.messages : [];
	const messageError = messageValidation.success ? undefined : messageValidation.message;
	const effectiveDisabled = disabled || !messageValidation.success;
	const visibleError = messageError ?? error;
	const hasHeader = header !== undefined || connection !== undefined || toolbar !== undefined;
	const busy = status === 'submitted' || status === 'streaming';
	return (
		<section
			data-slot='agent-chat'
			data-status={status}
			data-invalid-messages={messageError ? 'true' : 'false'}
			aria-busy={busy || undefined}
			className={cn(
				'border-border bg-background text-foreground flex size-full min-h-0 min-w-0 flex-col overflow-hidden rounded-md border',
				className,
			)}
			{...props}
		>
			{hasHeader ? (
				<header
					data-slot='agent-chat-header'
					className='border-border flex min-h-12 min-w-0 flex-wrap items-center gap-2 border-b px-3 py-2'
				>
					<div className='min-w-0 flex-1'>{header}</div>
					{connection !== undefined ? <div className='shrink-0'>{connection}</div> : null}
					{toolbar !== undefined ? <div className='flex shrink-0 items-center gap-1'>{toolbar}</div> : null}
				</header>
			) : null}
			<div className='relative min-h-0 flex-1'>
				<MessageScrollerProvider autoScroll={autoScroll} defaultScrollPosition='last-anchor'>
					<MessageScroller>
						<MessageScrollerViewport messages={messages?.scroller} aria-label={copy.transcript}>
							<MessageScrollerContent className='gap-5 px-3 py-5 md:px-6'>
								{visibleMessages.length === 0 ? (
									<div
										data-slot='agent-chat-empty'
										className='text-muted-foreground flex min-h-[16rem] flex-1 items-center justify-center px-4 text-center text-sm'
									>
										{emptyState ?? copy.empty}
									</div>
								) : (
									visibleMessages.map((message, index) => {
										const defaultMessage = (
											<AgentMessage
												{...messageProps}
												message={message}
												messages={messages?.message}
												renderPart={renderPart}
												renderTool={renderTool}
											/>
										);
										return (
											<MessageScrollerItem
												key={message.id}
												messageId={message.id}
												scrollAnchor={message.role === 'user'}
											>
												{resolveRenderedMessage(renderMessage?.({ defaultMessage, index, message }), defaultMessage)}
											</MessageScrollerItem>
										);
									})
								)}
							</MessageScrollerContent>
						</MessageScrollerViewport>
						<MessageScrollerButton messages={messages?.scroller} />
					</MessageScroller>
				</MessageScrollerProvider>
			</div>
			<div data-slot='agent-chat-composer-region' className='border-border shrink-0 border-t p-2 md:p-3'>
				{visibleError !== undefined ? (
					<div
						role='alert'
						aria-label={copy.errorLabel}
						className='text-error mb-2 flex min-w-0 items-center gap-2 px-1 text-sm'
					>
						<div className='min-w-0 flex-1 break-words'>{visibleError}</div>
						{onRetry ? (
							<button
								type='button'
								className='btn btn-ghost btn-sm shrink-0'
								disabled={effectiveDisabled || busy}
								onClick={onRetry}
							>
								<RotateCcw aria-hidden='true' className='size-4' />
								{copy.retry}
							</button>
						) : null}
					</div>
				) : null}
				<AgentComposer
					{...composerProps}
					disabled={effectiveDisabled}
					files={files}
					messages={messages?.composer}
					model={model}
					onFilesChange={onFilesChange}
					onStop={onStop}
					onSubmit={onSend}
					onValueChange={onTextChange}
					status={toComposerStatus(status)}
					value={text}
				/>
				{footer !== undefined ? (
					<footer data-slot='agent-chat-footer' className='text-muted-foreground px-1 pt-2 text-xs'>
						{footer}
					</footer>
				) : null}
			</div>
		</section>
	);
}

function resolveRenderedMessage(rendered: ReactNode | undefined, fallback: ReactNode) {
	return rendered === undefined ? fallback : rendered;
}

function toComposerStatus(status: AgentChatProps['status']): AgentComposerStatus {
	if (status === 'submitted') return 'submitting';
	return status;
}
