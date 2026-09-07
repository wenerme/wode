import type { ChatStatus, UIMessage } from 'ai';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { AgentComposerMessages, AgentComposerProps, AgentComposerSubmitValue } from '@components/agent-composer';
import type { AgentMessageMessages, AgentMessagePartRenderer, AgentMessageProps } from '@components/agent-message';
import type { MessageScrollerMessages } from '@components/message-scroller';

export type AgentChatMessages = {
	empty: string;
	errorLabel: string;
	pending?: string;
	retry: string;
	transcript: string;
};

export type ResolvedAgentChatMessages = AgentChatMessages & {
	pending: string;
};

export const defaultAgentChatMessages: ResolvedAgentChatMessages = {
	empty: '开始一段新对话',
	errorLabel: '对话出错',
	pending: '模型响应处理中',
	retry: '重试',
	transcript: '对话消息',
};

export type AgentChatMessageOverrides = Partial<AgentChatMessages> & {
	composer?: Partial<AgentComposerMessages>;
	message?: Partial<AgentMessageMessages>;
	scroller?: Partial<MessageScrollerMessages>;
};

export function resolveAgentChatMessages(messages?: AgentChatMessageOverrides): ResolvedAgentChatMessages {
	return { ...defaultAgentChatMessages, ...messages };
}

export type AgentChatRenderMessageContext = {
	defaultMessage: ReactNode;
	index: number;
	message: UIMessage;
};

export type AgentChatMessageRenderer = (context: AgentChatRenderMessageContext) => ReactNode | undefined;

export type AgentChatProps = Omit<ComponentPropsWithRef<'section'>, 'onError'> & {
	autoScroll?: boolean;
	composerProps?: Omit<
		AgentComposerProps,
		| 'error'
		| 'files'
		| 'messages'
		| 'model'
		| 'onFilesChange'
		| 'onStop'
		| 'onSubmit'
		| 'onValueChange'
		| 'status'
		| 'value'
	>;
	connection?: ReactNode;
	disabled?: boolean;
	emptyState?: ReactNode;
	error?: ReactNode;
	files: readonly File[];
	footer?: ReactNode;
	header?: ReactNode;
	messageProps?: Omit<AgentMessageProps, 'message' | 'messages' | 'renderPart' | 'renderTool'>;
	messages?: AgentChatMessageOverrides;
	model?: ReactNode;
	onFilesChange: (files: File[]) => void;
	onRetry?: () => void;
	onSend: (value: AgentComposerSubmitValue) => void;
	onStop?: () => void;
	onTextChange: (value: string) => void;
	renderMessage?: AgentChatMessageRenderer;
	renderPart?: AgentMessagePartRenderer;
	renderTool?: AgentMessagePartRenderer;
	status: ChatStatus;
	text: string;
	toolbar?: ReactNode;
	value: readonly UIMessage[];
};
