'use client';

import type { Persona } from '@wener/ai/agent/persona';
import type { Skill } from '@wener/ai/agent/skill';
import type { IFileSystem } from '@wener/common/fs';
import type { JustBashModuleLoader } from '@wener/common/fs/just-bash';
import type { ComponentPropsWithRef } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
	AiSdkAgentChat,
	type OpenAICompatibleConnectionConfig,
	type OpenAICompatibleConnectionDraft,
	OpenAICompatibleConnectionEditor,
	type OpenAICompatibleConnectionEditorMessages,
} from '../agent-ai-sdk';
import { AgentChat } from '../agent-chat';
import {
	type AgentActiveCommand,
	AgentCoding,
	type AgentCodingMessages,
	type AgentCommandExecutor,
	type AgentTerminalEntry,
	type AgentTerminalMessages,
	type AgentTerminalResult,
	appendAgentTerminalEntry,
	appendCompletedAgentTerminalEntry,
	completeAgentTerminalEntry,
	createAgentCommandRuntime,
} from '../agent-coding';
import {
	AgentWork,
	type AgentWorkMessages,
	type AgentWorkspace,
	type AgentWorkspaceContextLimits,
	createAgentWorkspaceMutationGuard,
	useAgentWorkspaceContext,
} from '../agent-work';
import {
	type AgentPlaygroundControlMessages,
	AgentPlaygroundControls,
	getAgentSkillIdentity,
} from './playground-controls';
import {
	type AgentPlaygroundMode,
	createAgentPlaygroundRuntimeConfiguration,
	createUnavailableAgentExecutor,
	isUnsafeAgentTerminalResult,
} from './playground-runtime';
import { type AgentPlaygroundApprovalMessages, renderAgentPlaygroundApproval } from './tool-approval-renderer';
import { useCommandRuntimeTransition } from './use-command-runtime-transition';
import { useJustBashExecutor } from './use-just-bash-executor';

export { AgentRuntimeIdentityChangedCancelReason } from './playground-runtime';

const blankConnection: OpenAICompatibleConnectionDraft = { apiKey: '', baseUrl: '', headers: {}, model: '' };

export type AgentPlaygroundMessages = {
	approval?: Partial<AgentPlaygroundApprovalMessages>;
	chatTitle: string;
	coding?: Partial<AgentCodingMessages>;
	codingTitle: string;
	connectionApplied: string;
	connectionEditor?: Partial<OpenAICompatibleConnectionEditorMessages>;
	connectionRequired: string;
	connectionSettings: string;
	controls?: Partial<AgentPlaygroundControlMessages>;
	executorHost: string;
	executorMissing: string;
	executorPoisoned: string;
	justBashError: string;
	justBashLoading: string;
	justBashReady: string;
	runtimeLabel: string;
	terminal?: Partial<AgentTerminalMessages>;
	work?: Partial<AgentWorkMessages>;
	workTitle: string;
};

export const defaultAgentPlaygroundMessages: AgentPlaygroundMessages = {
	chatTitle: '对话',
	codingTitle: '编码',
	connectionApplied: '连接已应用',
	connectionRequired: '请先应用连接配置',
	connectionSettings: '连接设置',
	executorHost: '宿主执行器',
	executorMissing: '尚未配置命令执行器',
	executorPoisoned: '已污染',
	justBashError: 'just-bash 加载失败',
	justBashLoading: '正在加载 just-bash',
	justBashReady: 'just-bash 就绪',
	runtimeLabel: '命令运行时：',
	workTitle: '工作',
};

export type AgentPlaygroundProps = ComponentPropsWithRef<'section'> & {
	agentsPath?: string;
	commandCancelSettleGraceMs?: number;
	contextLimits?: Partial<AgentWorkspaceContextLimits>;
	executor?: AgentCommandExecutor;
	fetch?: typeof globalThis.fetch;
	fileSystem: IFileSystem;
	initialConnection?: OpenAICompatibleConnectionDraft;
	initialConnectionApplied?: boolean;
	initialMode?: AgentPlaygroundMode;
	justBashLoader?: JustBashModuleLoader;
	messages?: Partial<AgentPlaygroundMessages>;
	personas: readonly Persona[];
	rootPath: string;
	skills: readonly Skill[];
	workspaceId: string;
};

export function AgentPlayground({
	agentsPath,
	className,
	commandCancelSettleGraceMs,
	contextLimits,
	executor: hostExecutor,
	fetch,
	fileSystem,
	initialConnection = blankConnection,
	initialConnectionApplied = false,
	initialMode = 'work',
	justBashLoader,
	messages,
	personas,
	rootPath,
	skills,
	workspaceId,
	...props
}: AgentPlaygroundProps) {
	const copy = { ...defaultAgentPlaygroundMessages, ...messages };
	const [mode, setMode] = useState<AgentPlaygroundMode>(initialMode);
	const [connectionDraft, setConnectionDraft] = useState<OpenAICompatibleConnectionDraft>(() =>
		cloneConnection(initialConnection),
	);
	const [connection, setConnection] = useState<OpenAICompatibleConnectionConfig | undefined>(() =>
		initialConnectionApplied ? cloneConnection(initialConnection) : undefined,
	);
	const [connectionRevision, setConnectionRevision] = useState(0);
	const [workspaceRevision, setWorkspaceRevision] = useState(0);
	const [contextRevision, setContextRevision] = useState(0);
	const [selectedPersonaId, setSelectedPersonaId] = useState(personas[0]?.id ?? '');
	const [selectedSkillIdentities, setSelectedSkillIdentities] = useState<Set<string>>(
		() => new Set(skills.map(getAgentSkillIdentity)),
	);
	const [terminalCommand, setTerminalCommand] = useState('');
	const [terminalEntries, setTerminalEntries] = useState<AgentTerminalEntry[]>([]);
	const [activeCommand, setActiveCommand] = useState<AgentActiveCommand>();
	const runtimePoisonedRef = useRef(false);
	const guardedFileSystem = useMemo(
		() => createAgentWorkspaceMutationGuard(fileSystem, () => !runtimePoisonedRef.current),
		[fileSystem],
	);
	const commandSequence = useRef(0);
	const incrementWorkspaceRevision = useCallback(() => setWorkspaceRevision((value) => value + 1), []);
	const refreshWorkspaceContext = useCallback(() => {
		setWorkspaceRevision((value) => value + 1);
		setContextRevision((value) => value + 1);
	}, []);
	const runtimeWorkspace = useMemo<AgentWorkspace>(
		() => ({
			fileSystem: guardedFileSystem,
			id: workspaceId,
			label: workspaceId,
			rootPath,
		}),
		[guardedFileSystem, rootPath, workspaceId],
	);
	const workspace = useMemo<AgentWorkspace>(
		() => ({ ...runtimeWorkspace, revision: workspaceRevision }),
		[runtimeWorkspace, workspaceRevision],
	);
	const contextWorkspace = useMemo<AgentWorkspace>(
		() => ({ ...runtimeWorkspace, revision: contextRevision }),
		[contextRevision, runtimeWorkspace],
	);
	const selectedPersona = personas.find((persona) => persona.id === selectedPersonaId);
	const selectedSkills = useMemo(
		() => skills.filter((skill) => selectedSkillIdentities.has(getAgentSkillIdentity(skill))),
		[selectedSkillIdentities, skills],
	);
	const contextState = useAgentWorkspaceContext({
		agentsPath,
		enabled: mode !== 'chat',
		limits: contextLimits,
		skills: selectedSkills,
		workspace: contextWorkspace,
	});
	const justBash = useJustBashExecutor({
		enabled: mode === 'coding' && !hostExecutor,
		loader: justBashLoader,
		onWorkspaceChanged: incrementWorkspaceRevision,
		workspace: runtimeWorkspace,
	});
	const unavailableExecutor = useMemo(
		() => createUnavailableAgentExecutor(copy.executorMissing),
		[copy.executorMissing],
	);
	const executor = hostExecutor ?? justBash.executor ?? unavailableExecutor;
	const candidateCommandRuntime = useMemo(
		() => createAgentCommandRuntime(executor, { cancelSettleGraceMs: commandCancelSettleGraceMs }),
		[commandCancelSettleGraceMs, executor],
	);
	const commandRuntimeIdentity = useMemo(
		() => ({
			context: contextState.context,
			fileSystem,
			mode,
			rootPath,
			selectedPersonaId,
			selectedSkillIdentities,
			workspaceId,
		}),
		[contextState.context, fileSystem, mode, rootPath, selectedPersonaId, selectedSkillIdentities, workspaceId],
	);
	const {
		commandRuntime,
		generation: runtimeGeneration,
		poisoned: runtimePoisoned,
		revision: commandRuntimeRevision,
		setPoisoned: setRuntimePoisoned,
	} = useCommandRuntimeTransition(candidateCommandRuntime, commandRuntimeIdentity, runtimePoisonedRef);
	const runtimeRevision = commandRuntimeRevision + connectionRevision;
	const commandGenerations = useRef(new Map<string, number>());

	const commandStarted = useCallback(({ command, toolCallId }: { command: string; toolCallId: string }) => {
		const startedAt = Date.now();
		commandGenerations.current.set(toolCallId, runtimeGeneration.current);
		setActiveCommand({ command, id: toolCallId, startedAt });
		setTerminalEntries((current) =>
			appendAgentTerminalEntry(current, { command, id: toolCallId, startedAt, status: 'running' }),
		);
	}, []);
	const commandFinished = useCallback(
		({
			acquired,
			command,
			result,
			toolCallId,
		}: {
			acquired: boolean;
			command: string;
			result: AgentTerminalResult;
			toolCallId: string;
		}) => {
			if (!acquired) {
				const startedAt = Date.now();
				setTerminalEntries((current) =>
					appendCompletedAgentTerminalEntry(current, { command, id: toolCallId, startedAt }, result),
				);
				return;
			}
			const generation = commandGenerations.current.get(toolCallId);
			commandGenerations.current.delete(toolCallId);
			setTerminalEntries((current) => completeAgentTerminalEntry(current, toolCallId, result));
			setActiveCommand((current) => (current?.id === toolCallId ? undefined : current));
			if (generation === runtimeGeneration.current && isUnsafeAgentTerminalResult(result)) setRuntimePoisoned(true);
		},
		[],
	);
	const runtime = useMemo(
		() =>
			createAgentPlaygroundRuntimeConfiguration({
				coding: {
					onCommandFinish: commandFinished,
					onCommandStart: commandStarted,
					onWorkspaceChanged: incrementWorkspaceRevision,
				},
				commandRuntime,
				context: contextState.context,
				mode,
				persona: selectedPersona,
				workspace: runtimeWorkspace,
			}),
		[
			commandFinished,
			commandRuntime,
			commandStarted,
			contextState.context,
			incrementWorkspaceRevision,
			mode,
			runtimeWorkspace,
			selectedPersona,
		],
	);

	const runTerminalCommand = useCallback(
		(command: string) => {
			const id = `terminal-${++commandSequence.current}`;
			const startedAt = Date.now();
			let acquired = false;
			let generation: number | undefined;
			setTerminalCommand('');
			void commandRuntime
				.execute(
					{ command },
					{
						onAcquired: () => {
							acquired = true;
							generation = runtimeGeneration.current;
							setActiveCommand({ command, id, startedAt });
							setTerminalEntries((current) =>
								appendAgentTerminalEntry(current, { command, id, startedAt, status: 'running' }),
							);
						},
					},
				)
				.then((result) => {
					if (acquired) {
						setTerminalEntries((current) => completeAgentTerminalEntry(current, id, result));
						setActiveCommand((current) => (current?.id === id ? undefined : current));
						if (generation === runtimeGeneration.current && isUnsafeAgentTerminalResult(result)) {
							setRuntimePoisoned(true);
						}
					} else {
						setTerminalEntries((current) =>
							appendCompletedAgentTerminalEntry(current, { command, id, startedAt }, result),
						);
					}
					if (generation === runtimeGeneration.current && result.workspaceChanged) incrementWorkspaceRevision();
				});
		},
		[commandRuntime, incrementWorkspaceRevision],
	);
	const cancelCommand = useCallback(
		(id: string) => {
			if (activeCommand?.id === id) commandRuntime.cancelCurrent('用户取消');
		},
		[activeCommand?.id, commandRuntime],
	);

	const modeTitle = mode === 'chat' ? copy.chatTitle : mode === 'work' ? copy.workTitle : copy.codingTitle;
	const chat = connection ? (
		<AiSdkAgentChat
			className='rounded-none border-0'
			connection={connection}
			connectionRevision={runtimeRevision}
			connectionSlot={<span className='badge badge-success badge-sm'>{copy.connectionApplied}</span>}
			fetch={fetch}
			header={<h2 className='truncate text-sm font-semibold'>{modeTitle}</h2>}
			instructions={runtime.instructions}
			renderTool={(context) => renderAgentPlaygroundApproval(context, copy.approval)}
			tools={runtime.tools}
		/>
	) : (
		<AgentChat
			className='rounded-none border-0'
			disabled
			emptyState={copy.connectionRequired}
			files={[]}
			header={<h2 className='text-sm font-semibold'>{modeTitle}</h2>}
			status='ready'
			text=''
			value={[]}
			onFilesChange={() => undefined}
			onSend={() => undefined}
			onTextChange={() => undefined}
		/>
	);
	const work = (
		<AgentWork
			className='min-h-0'
			chat={chat}
			context={contextState.context}
			messages={copy.work}
			workspace={workspace}
			workspaceReadOnly={runtimePoisoned}
		/>
	);
	const coding = (
		<AgentCoding
			className='min-h-0'
			activeCommand={activeCommand}
			chat={chat}
			command={terminalCommand}
			context={contextState.context}
			entries={terminalEntries}
			messages={{ ...copy.work, ...copy.coding }}
			poisoned={runtimePoisoned}
			terminalMessages={copy.terminal}
			workspace={workspace}
			onCancelCommand={cancelCommand}
			onCommandChange={setTerminalCommand}
			onRunCommand={runTerminalCommand}
		/>
	);

	return (
		<section
			data-slot='agent-playground'
			data-mode={mode}
			data-runtime-revision={runtimeRevision}
			className={cn(
				'border-border bg-background flex size-full min-h-[40rem] min-w-0 flex-col overflow-hidden rounded-md border',
				className,
			)}
			{...props}
		>
			<details open className='border-border shrink-0 border-b'>
				<summary className='bg-muted/20 cursor-pointer px-3 py-2 text-sm font-semibold'>
					{copy.connectionSettings}
				</summary>
				<OpenAICompatibleConnectionEditor
					applied={Boolean(connection)}
					draft={connectionDraft}
					fetch={fetch}
					messages={copy.connectionEditor}
					revealIdentity={runtimeRevision}
					onApply={(next) => {
						setConnection(cloneConnection(next));
						setConnectionRevision((value) => value + 1);
					}}
					onDraftChange={setConnectionDraft}
				/>
			</details>
			<AgentPlaygroundControls
				contextStatus={contextState.status}
				messages={copy.controls}
				mode={mode}
				onModeChange={setMode}
				onPersonaChange={setSelectedPersonaId}
				onRefreshWorkspace={refreshWorkspaceContext}
				onSkillChange={(identity, selected) =>
					setSelectedSkillIdentities((current) => {
						const next = new Set(current);
						if (selected) next.add(identity);
						else next.delete(identity);
						return next;
					})
				}
				personas={personas}
				selectedPersonaId={selectedPersonaId}
				selectedSkillIdentities={selectedSkillIdentities}
				skills={skills}
			/>
			{mode === 'coding' ? (
				<div className='border-border bg-muted/15 flex min-h-8 shrink-0 items-center gap-2 border-b px-3 text-xs'>
					<span>{copy.runtimeLabel}</span>
					<span
						className={cn(
							'badge badge-sm',
							runtimePoisoned || justBash.status === 'error'
								? 'badge-error'
								: justBash.status === 'loading'
									? 'badge-warning'
									: 'badge-success',
						)}
					>
						{runtimePoisoned
							? copy.executorPoisoned
							: hostExecutor
								? copy.executorHost
								: justBash.status === 'loading'
									? copy.justBashLoading
									: justBash.status === 'error'
										? copy.justBashError
										: justBash.status === 'ready'
											? copy.justBashReady
											: copy.executorMissing}
					</span>
					{justBash.error ? (
						<span role='alert' className='text-error min-w-0 truncate'>
							{justBash.error.message}
						</span>
					) : null}
				</div>
			) : null}
			<div className='min-h-0 flex-1'>{mode === 'chat' ? chat : mode === 'work' ? work : coding}</div>
		</section>
	);
}

function cloneConnection<T extends OpenAICompatibleConnectionConfig>(connection: T): T {
	return { ...connection, headers: connection.headers ? { ...connection.headers } : undefined };
}
