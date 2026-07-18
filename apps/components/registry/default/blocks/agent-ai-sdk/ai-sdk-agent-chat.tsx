'use client';

import { useChat } from '@ai-sdk/react';
import {
	type ChatOnFinishCallback,
	type ChatOnToolCallCallback,
	type Instructions,
	lastAssistantMessageIsCompleteWithApprovalResponses,
	type ToolSet,
	type UIMessage,
} from 'ai';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AgentMessagePartRenderContext } from '../../ui/agent-message';
import { AgentChat, type AgentChatProps, validateAgentRuntimeMessages } from '../agent-chat';
import type { OpenAICompatibleConnectionConfig } from './connection-config';
import { sameOpenAICompatibleConnection, validateOpenAICompatibleConnection } from './connection-config';
import { createOpenAICompatibleDirectTransport } from './direct-transport';
import type { OpenAICompatibleDirectTransportLimits } from './direct-transport-limits';
import {
	AgentRuntimeFileError,
	type AgentRuntimeFileLimits,
	convertAgentFilesToUIParts,
	resolveAgentRuntimeFileLimits,
} from './file-parts';
import { bindAgentTransportGeneration } from './generation-transport';
import { isAbortError, toSafeAgentError } from './safe-error';
import {
	type AgentToolApprovalResponder,
	type AgentToolApprovalResponse,
	createAgentToolApprovalResponder,
} from './tool-approval';

export type AiSdkAgentToolRenderContext = AgentMessagePartRenderContext & {
	respondToApproval: AgentToolApprovalResponder;
};

export type AiSdkAgentChatProps = Omit<
	AgentChatProps,
	| 'connection'
	| 'disabled'
	| 'error'
	| 'files'
	| 'onFilesChange'
	| 'onRetry'
	| 'onSend'
	| 'onStop'
	| 'onTextChange'
	| 'renderTool'
	| 'status'
	| 'text'
	| 'value'
> &
	AgentRuntimeFileLimits & {
		chatMessages?: readonly UIMessage[];
		connection: OpenAICompatibleConnectionConfig;
		connectionRevision?: number | string;
		connectionSlot?: import('react').ReactNode;
		fetch?: typeof globalThis.fetch;
		instructions?: Instructions;
		maxSteps?: number;
		onError?: (error: Error) => void;
		onFinish?: ChatOnFinishCallback<UIMessage>;
		onMessagesChange?: (messages: UIMessage[]) => void;
		onToolCall?: ChatOnToolCallCallback<UIMessage>;
		renderTool?: (context: AiSdkAgentToolRenderContext) => import('react').ReactNode | undefined;
		tools?: ToolSet;
		transportLimits?: OpenAICompatibleDirectTransportLimits;
	};

export function AiSdkAgentChat(props: AiSdkAgentChatProps) {
	const validation = validateOpenAICompatibleConnection(props.connection);
	const messageValidation = validateAgentRuntimeMessages(props.chatMessages ?? []);
	const connection = validation.success ? validation.value : undefined;
	const runtime = useRuntimeRevision({
		connection,
		explicit: props.connectionRevision,
		fetch: props.fetch,
		instructions: props.instructions,
		maxSteps: props.maxSteps,
		tools: props.tools,
		transportLimits: props.transportLimits,
	});
	if (!connection || !messageValidation.success) {
		const connectionError = validation.success ? undefined : validation.issues[0]?.message;
		return (
			<AgentChat
				{...presenterProps(props)}
				connection={props.connectionSlot}
				disabled
				error={messageValidation.success ? (connectionError ?? '连接配置无效。') : messageValidation.message}
				files={[]}
				status='error'
				text=''
				value={[]}
				onFilesChange={() => undefined}
				onSend={() => undefined}
				onTextChange={() => undefined}
			/>
		);
	}
	if (runtime.pending) return null;
	return <AiSdkAgentChatSession key={runtime.revision} {...props} connection={connection} />;
}

function AiSdkAgentChatSession({
	chatMessages,
	composerProps,
	connection,
	connectionRevision: _connectionRevision,
	connectionSlot,
	fetch,
	instructions,
	maxFileSize,
	maxFiles,
	maxSteps,
	maxTotalSize,
	model,
	onError,
	onFinish,
	onMessagesChange,
	onToolCall,
	renderTool,
	tools,
	transportLimits,
	...chatProps
}: AiSdkAgentChatProps) {
	const generation = useRef(0);
	const transport = useMemo(
		() =>
			bindAgentTransportGeneration(
				createOpenAICompatibleDirectTransport({
					connection,
					fetch,
					instructions,
					limits: transportLimits,
					maxSteps,
					tools,
				}),
				generation,
			),
		[connection, fetch, instructions, maxSteps, tools, transportLimits],
	);
	const safeError = (error: unknown) =>
		toSafeAgentError(error, [connection.apiKey ?? '', ...Object.values(connection.headers ?? {})]);
	const { addToolApprovalResponse, clearError, error, messages, regenerate, sendMessage, setMessages, status, stop } =
		useChat<UIMessage>({
			messages: chatMessages ? [...chatMessages] : [],
			onError: (value) => onError?.(safeError(value)),
			onFinish,
			onToolCall,
			sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
			transport,
		});
	const [text, setText] = useState('');
	const [files, setFiles] = useState<File[]>([]);
	const [localError, setLocalError] = useState<Error>();
	const mounted = useRef(false);
	const fileController = useRef<AbortController | undefined>(undefined);
	const appliedExternalMessages = useRef<readonly UIMessage[] | undefined>(chatMessages);
	const externalMessagesTarget = useRef<readonly UIMessage[] | null>(null);
	const handledMessages = useRef<readonly UIMessage[]>(messages);
	const messagesRef = useRef<readonly UIMessage[]>(messages);
	const onMessagesChangeRef = useRef(onMessagesChange);
	messagesRef.current = messages;
	onMessagesChangeRef.current = onMessagesChange;
	const approvalRuntime = useRef<{
		beforeRespond: (response: AgentToolApprovalResponse) => void;
		onError: (error: unknown) => void;
		respond: (response: AgentToolApprovalResponse) => void | PromiseLike<void>;
	} | null>(null);
	approvalRuntime.current = {
		beforeRespond: () => requireValidTranscript(messagesRef.current),
		onError: (value) => reportLocalError(value),
		respond: (response) => addToolApprovalResponse(response),
	};
	const respondToApproval = useMemo(
		() =>
			createAgentToolApprovalResponder({
				beforeRespond: (response) => approvalRuntime.current?.beforeRespond(response),
				onError: (value) => approvalRuntime.current?.onError(value),
				respond: (response) => approvalRuntime.current?.respond(response),
			}),
		[],
	);
	const limits = resolveAgentRuntimeFileLimits({ maxFileSize, maxFiles, maxTotalSize });

	useEffect(() => {
		if (chatMessages !== appliedExternalMessages.current) {
			appliedExternalMessages.current = chatMessages;
			handledMessages.current = messages;
			const target = chatMessages ? [...chatMessages] : [];
			if (sameMessages(target, messages)) {
				externalMessagesTarget.current = null;
				return;
			}
			externalMessagesTarget.current = target;
			generation.current += 1;
			fileController.current?.abort();
			void stop();
			setLocalError(undefined);
			setMessages(target);
			return;
		}
		const target = externalMessagesTarget.current;
		if (target) {
			handledMessages.current = messages;
			if (sameMessages(target, messages)) externalMessagesTarget.current = null;
			return;
		}
		if (messages === handledMessages.current) return;
		handledMessages.current = messages;
		onMessagesChangeRef.current?.(messages);
	}, [chatMessages, messages, setMessages, stop]);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			generation.current += 1;
			fileController.current?.abort();
			void stop();
		};
	}, [stop]);

	function reportLocalError(value: unknown) {
		if (!mounted.current) return;
		const next = safeError(value);
		setLocalError(next);
		onError?.(next);
	}

	async function send(input: { files: File[]; text: string }) {
		try {
			requireValidTranscript(messagesRef.current);
		} catch (value) {
			reportLocalError(value);
			return;
		}
		fileController.current?.abort();
		const controller = new AbortController();
		const currentGeneration = generation.current;
		fileController.current = controller;
		try {
			const parts = await convertAgentFilesToUIParts(input.files, limits, controller.signal);
			if (!mounted.current || fileController.current !== controller || generation.current !== currentGeneration) return;
			setLocalError(undefined);
			clearError();
			const request = sendMessage({ files: parts, text: input.text });
			setText('');
			setFiles([]);
			void request;
		} catch (value) {
			if (!isAbortError(value) && !(value instanceof AgentRuntimeFileError && value.code === 'aborted')) {
				reportLocalError(value);
			}
		} finally {
			if (fileController.current === controller) fileController.current = undefined;
		}
	}

	function stopCurrent() {
		generation.current += 1;
		fileController.current?.abort();
		void stop();
	}

	function retry() {
		try {
			requireValidTranscript(messagesRef.current);
		} catch (value) {
			reportLocalError(value);
			return;
		}
		setLocalError(undefined);
		clearError();
		void regenerate();
	}

	return (
		<AgentChat
			{...chatProps}
			composerProps={{
				...composerProps,
				maxFileSize: limits.maxFileSize,
				maxFiles: limits.maxFiles,
				maxTotalSize: limits.maxTotalSize,
			}}
			error={localError?.message ?? (error ? safeError(error).message : undefined)}
			connection={connectionSlot}
			files={files}
			model={model ?? <span className='text-muted-foreground max-w-40 truncate px-1 text-xs'>{connection.model}</span>}
			status={status}
			text={text}
			value={messages}
			onFilesChange={(next) => {
				setLocalError(undefined);
				setFiles(next);
			}}
			onRetry={error || localError ? retry : undefined}
			onSend={(input) => void send(input)}
			onStop={stopCurrent}
			onTextChange={(next) => {
				setLocalError(undefined);
				if (status === 'error') clearError();
				setText(next);
			}}
			renderTool={renderTool ? (context) => renderTool({ ...context, respondToApproval }) : undefined}
		/>
	);
}

function requireValidTranscript(messages: readonly UIMessage[]) {
	const validation = validateAgentRuntimeMessages(messages);
	if (!validation.success) throw new Error(validation.message);
}

function presenterProps(
	props: AiSdkAgentChatProps,
): Omit<
	AgentChatProps,
	| 'connection'
	| 'disabled'
	| 'error'
	| 'files'
	| 'onFilesChange'
	| 'onRetry'
	| 'onSend'
	| 'onStop'
	| 'onTextChange'
	| 'renderTool'
	| 'status'
	| 'text'
	| 'value'
> {
	const {
		chatMessages: _chatMessages,
		connection: _connection,
		connectionRevision: _connectionRevision,
		connectionSlot: _connectionSlot,
		fetch: _fetch,
		instructions: _instructions,
		maxFileSize: _maxFileSize,
		maxFiles: _maxFiles,
		maxSteps: _maxSteps,
		maxTotalSize: _maxTotalSize,
		onError: _onError,
		onFinish: _onFinish,
		onMessagesChange: _onMessagesChange,
		onToolCall: _onToolCall,
		renderTool: _renderTool,
		tools: _tools,
		transportLimits: _transportLimits,
		...rest
	} = props;
	return rest;
}

type RuntimeIdentity = {
	connection?: OpenAICompatibleConnectionConfig;
	explicit?: number | string;
	fetch?: typeof globalThis.fetch;
	instructions?: Instructions;
	maxSteps?: number;
	tools?: ToolSet;
	transportLimits?: OpenAICompatibleDirectTransportLimits;
};

function useRuntimeRevision(identity: RuntimeIdentity): { pending: boolean; revision: number } {
	const [committed, setCommitted] = useState(() => ({ identity: snapshotRuntimeIdentity(identity), revision: 1 }));
	const pending = !sameRuntimeIdentity(committed.identity, identity);
	useLayoutEffect(() => {
		if (!pending) return;
		setCommitted((current) =>
			sameRuntimeIdentity(current.identity, identity)
				? current
				: { identity: snapshotRuntimeIdentity(identity), revision: current.revision + 1 },
		);
	}, [identity, pending]);
	return { pending, revision: committed.revision };
}

function sameRuntimeIdentity(left: RuntimeIdentity, right: RuntimeIdentity): boolean {
	return (
		left.explicit === right.explicit &&
		left.fetch === right.fetch &&
		left.instructions === right.instructions &&
		left.maxSteps === right.maxSteps &&
		left.tools === right.tools &&
		sameTransportLimits(left.transportLimits, right.transportLimits) &&
		((!left.connection && !right.connection) ||
			(Boolean(left.connection) &&
				Boolean(right.connection) &&
				sameOpenAICompatibleConnection(left.connection!, right.connection!)))
	);
}

function sameTransportLimits(
	left: OpenAICompatibleDirectTransportLimits | undefined,
	right: OpenAICompatibleDirectTransportLimits | undefined,
): boolean {
	if (!left || !right) return left === right;
	return (
		left.maxOutputTokens === right.maxOutputTokens &&
		left.maxResponseBytes === right.maxResponseBytes &&
		left.maxResponseChunks === right.maxResponseChunks &&
		left.maxRetries === right.maxRetries &&
		left.maxStreamChunks === right.maxStreamChunks &&
		left.maxStreamProjectionBytes === right.maxStreamProjectionBytes &&
		left.timeout?.chunkMs === right.timeout?.chunkMs &&
		left.timeout?.stepMs === right.timeout?.stepMs &&
		left.timeout?.toolMs === right.timeout?.toolMs &&
		left.timeout?.totalMs === right.timeout?.totalMs
	);
}

function sameMessages(left: readonly UIMessage[], right: readonly UIMessage[]): boolean {
	return left.length === right.length && left.every((message, index) => message === right[index]);
}

function snapshotRuntimeIdentity(identity: RuntimeIdentity): RuntimeIdentity {
	return {
		...identity,
		connection: identity.connection
			? {
					...identity.connection,
					headers: identity.connection.headers ? { ...identity.connection.headers } : undefined,
				}
			: undefined,
		transportLimits: identity.transportLimits
			? {
					...identity.transportLimits,
					timeout: identity.transportLimits.timeout ? { ...identity.transportLimits.timeout } : undefined,
				}
			: undefined,
	};
}
