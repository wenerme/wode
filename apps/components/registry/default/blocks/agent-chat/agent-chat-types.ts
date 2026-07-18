import type { ChatStatus, UIMessage } from 'ai';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { AgentComposerMessages, AgentComposerProps, AgentComposerSubmitValue } from '../../ui/agent-composer';
import type { AgentMessageMessages, AgentMessagePartRenderer, AgentMessageProps } from '../../ui/agent-message';
import type { MessageScrollerMessages } from '../../ui/message-scroller';

export type AgentChatMessages = {
	empty: string;
	errorLabel: string;
	retry: string;
	transcript: string;
};

export const defaultAgentChatMessages: AgentChatMessages = {
	empty: '开始一段新对话',
	errorLabel: '对话出错',
	retry: '重试',
	transcript: '对话消息',
};

export type AgentChatMessageOverrides = Partial<AgentChatMessages> & {
	composer?: Partial<AgentComposerMessages>;
	message?: Partial<AgentMessageMessages>;
	scroller?: Partial<MessageScrollerMessages>;
};

export function resolveAgentChatMessages(messages?: AgentChatMessageOverrides): AgentChatMessages {
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
