'use client';

import { Files, MessagesSquare } from 'lucide-react';
import {
	type ComponentPropsWithRef,
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';
import { FileManager, type FileManagerProps } from '@/components/file-manager/file-manager';
import { createFileManagerStore } from '@/components/file-manager/file-manager-store';
import type { FileManagerStore } from '@/components/file-manager/file-manager-types';
import { cn } from '@/lib/utils';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../ui/resizable';
import type { AgentWorkspace, AgentWorkspaceContext } from './workspace-types';

export type AgentWorkPane = 'chat' | 'workspace';

export type AgentWorkTab = {
	id: string;
	label: ReactNode;
	panel: ReactNode;
};

export type AgentWorkMessages = {
	chatPane: string;
	contextTab: string;
	filesTab: string;
	workspacePane: string;
};

export const defaultAgentWorkMessages: AgentWorkMessages = {
	chatPane: '对话',
	contextTab: '上下文',
	filesTab: '文件',
	workspacePane: '工作区',
};

export type AgentWorkProps = ComponentPropsWithRef<'section'> & {
	chat: ReactNode;
	context?: AgentWorkspaceContext;
	defaultPane?: AgentWorkPane;
	defaultWorkspaceTab?: string;
	extraWorkspaceTabs?: readonly AgentWorkTab[];
	fileManagerProps?: Omit<FileManagerProps, 'fileSystem' | 'rootPath'>;
	messages?: Partial<AgentWorkMessages>;
	onPaneChange?: (pane: AgentWorkPane) => void;
	onWorkspaceTabChange?: (tab: string) => void;
	pane?: AgentWorkPane;
	workspace: AgentWorkspace;
	workspaceTab?: string;
	workspaceReadOnly?: boolean;
};

export function AgentWork({
	chat,
	className,
	context,
	defaultPane = 'chat',
	defaultWorkspaceTab = 'files',
	extraWorkspaceTabs = [],
	fileManagerProps,
	messages,
	onPaneChange,
	onWorkspaceTabChange,
	pane,
	workspace,
	workspaceTab,
	workspaceReadOnly = false,
	...props
}: AgentWorkProps) {
	const copy = { ...defaultAgentWorkMessages, ...messages };
	const rootRef = useRef<HTMLElement>(null);
	const [narrow, setNarrow] = useState(false);
	const [localPane, setLocalPane] = useState<AgentWorkPane>(defaultPane);
	const [localTab, setLocalTab] = useState(defaultWorkspaceTab);
	const visiblePane = pane ?? localPane;
	const visibleTab = workspaceTab ?? localTab;
	const fileStore = useAgentWorkFileStore(workspace, fileManagerProps?.store);
	const tabs = useMemo<AgentWorkTab[]>(
		() => [
			{
				id: 'files',
				label: copy.filesTab,
				panel: (
					<FileManager
						{...fileManagerProps}
						className={cn('size-full min-h-0 rounded-none border-0', fileManagerProps?.className)}
						fileSystem={workspace.fileSystem}
						rootPath={workspace.rootPath}
						readOnly={workspaceReadOnly || fileManagerProps?.readOnly}
						showHeader={false}
						store={fileStore}
					/>
				),
			},
			{ id: 'context', label: copy.contextTab, panel: <AgentWorkContextPanel context={context} /> },
			...extraWorkspaceTabs,
		],
		[
			context,
			copy.contextTab,
			copy.filesTab,
			extraWorkspaceTabs,
			fileManagerProps,
			fileStore,
			workspace,
			workspaceReadOnly,
		],
	);
	const activeTab = tabs.find((tab) => tab.id === visibleTab) ?? tabs[0];

	useEffect(() => {
		const element = rootRef.current;
		if (!element) return;
		const update = () => setNarrow(element.getBoundingClientRect().width < 768);
		update();
		if (typeof ResizeObserver !== 'function') return;
		const observer = new ResizeObserver(update);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const selectPane = (next: AgentWorkPane) => {
		if (pane === undefined) setLocalPane(next);
		onPaneChange?.(next);
	};
	const selectTab = (next: string) => {
		if (workspaceTab === undefined) setLocalTab(next);
		onWorkspaceTabChange?.(next);
	};
	const workspacePanel = (
		<AgentWorkspacePanel activeTab={activeTab.id} tabs={tabs} onTabChange={selectTab}>
			{activeTab.panel}
		</AgentWorkspacePanel>
	);

	return (
		<section
			ref={rootRef}
			data-layout={narrow ? 'narrow' : 'wide'}
			data-slot='agent-work'
			className={cn(
				'border-border bg-background text-foreground flex size-full min-h-[32rem] min-w-0 flex-col overflow-hidden rounded-md border',
				className,
			)}
			{...props}
		>
			{narrow ? (
				<>
					<div className='border-border bg-muted/30 flex shrink-0 items-center justify-center border-b p-2'>
						<fieldset className='join min-w-0 border-0 p-0'>
							<legend className='sr-only'>工作模式面板</legend>
							<PaneButton active={visiblePane === 'chat'} icon={<MessagesSquare />} onClick={() => selectPane('chat')}>
								{copy.chatPane}
							</PaneButton>
							<PaneButton active={visiblePane === 'workspace'} icon={<Files />} onClick={() => selectPane('workspace')}>
								{copy.workspacePane}
							</PaneButton>
						</fieldset>
					</div>
					<div className='min-h-0 flex-1'>{visiblePane === 'chat' ? chat : workspacePanel}</div>
				</>
			) : (
				<ResizablePanelGroup orientation='horizontal'>
					<ResizablePanel defaultSize='55%' minSize='30%'>
						<div className='size-full min-h-0'>{chat}</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize='45%' minSize='28%'>
						{workspacePanel}
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</section>
	);
}

function AgentWorkspacePanel({
	activeTab,
	children,
	onTabChange,
	tabs,
}: {
	activeTab: string;
	children: ReactNode;
	onTabChange: (tab: string) => void;
	tabs: readonly AgentWorkTab[];
}) {
	const tabPanelId = useId();
	const tabRefs = useRef(new Map<string, HTMLButtonElement>());
	const activeIndex = Math.max(
		0,
		tabs.findIndex((tab) => tab.id === activeTab),
	);
	const activeTabId = `${tabPanelId}-tab-${activeIndex}`;
	const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
		let nextIndex = index;
		if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
		else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
		else if (event.key === 'Home') nextIndex = 0;
		else if (event.key === 'End') nextIndex = tabs.length - 1;
		else return;
		event.preventDefault();
		const next = tabs[nextIndex];
		if (!next) return;
		onTabChange(next.id);
		tabRefs.current.get(next.id)?.focus();
	};
	return (
		<section className='flex size-full min-h-0 min-w-0 flex-col' aria-label='工作区面板'>
			<div
				className='tabs tabs-border border-border min-h-11 shrink-0 border-b px-2'
				role='tablist'
				aria-label='工作区视图'
			>
				{tabs.map((tab, index) => (
					<button
						key={tab.id}
						id={`${tabPanelId}-tab-${index}`}
						ref={(element) => {
							if (element) tabRefs.current.set(tab.id, element);
							else tabRefs.current.delete(tab.id);
						}}
						type='button'
						role='tab'
						aria-controls={tabPanelId}
						aria-selected={activeTab === tab.id}
						tabIndex={activeTab === tab.id ? 0 : -1}
						className={cn('tab min-h-10', activeTab === tab.id && 'tab-active')}
						onKeyDown={(event) => handleKeyDown(event, index)}
						onClick={() => onTabChange(tab.id)}
					>
						{tab.label}
					</button>
				))}
			</div>
			<div id={tabPanelId} role='tabpanel' aria-labelledby={activeTabId} className='min-h-0 flex-1'>
				{children}
			</div>
		</section>
	);
}

function AgentWorkContextPanel({ context }: { context?: AgentWorkspaceContext }) {
	if (!context) return <div className='text-muted-foreground p-4 text-sm'>尚未加载工作区上下文。</div>;
	return (
		<div data-slot='agent-work-context' className='size-full min-h-0 overflow-auto'>
			<header className='border-border border-b px-4 py-3'>
				<h2 className='text-sm font-semibold'>工作区上下文</h2>
				<p className='text-muted-foreground mt-1 text-xs'>{context.bytes} 字节</p>
			</header>
			{context.agents ? (
				<section className='border-border border-b px-4 py-3'>
					<h3 className='text-xs font-semibold'>{context.agents.path}</h3>
					<pre className='bg-muted mt-2 max-h-64 overflow-auto rounded-sm p-3 text-xs whitespace-pre-wrap'>
						{context.agents.content}
					</pre>
				</section>
			) : null}
			{context.skills.map((skill) => (
				<section key={skill.identity} className='border-border border-b px-4 py-3'>
					<h3 className='text-xs font-semibold'>
						{skill.name}@{skill.version}
					</h3>
					<p className='text-muted-foreground mt-1 text-xs'>{skill.description}</p>
					<pre className='bg-muted mt-2 max-h-56 overflow-auto rounded-sm p-3 text-xs whitespace-pre-wrap'>
						{skill.instructions}
					</pre>
				</section>
			))}
			{context.issues.length ? (
				<section aria-label='上下文问题' className='px-4 py-3'>
					<h3 className='text-warning text-xs font-semibold'>上下文问题</h3>
					<ul className='mt-2 space-y-1 text-xs'>
						{context.issues.map((issue, index) => (
							<li key={`${issue.code}:${issue.path ?? issue.skillIdentity ?? issue.skillName ?? index}`}>
								{issue.message}
							</li>
						))}
					</ul>
				</section>
			) : null}
		</div>
	);
}

function PaneButton({
	active,
	children,
	icon,
	onClick,
}: {
	active: boolean;
	children: ReactNode;
	icon: ReactNode;
	onClick: () => void;
}) {
	return (
		<button
			type='button'
			className={cn('btn btn-sm join-item min-w-28', active ? 'btn-neutral' : 'btn-ghost')}
			aria-pressed={active}
			onClick={onClick}
		>
			<span aria-hidden='true' className='[&>svg]:size-4'>
				{icon}
			</span>
			{children}
		</button>
	);
}

function useAgentWorkFileStore(workspace: AgentWorkspace, supplied?: FileManagerStore): FileManagerStore {
	const [local] = useState(() =>
		createFileManagerStore({ fileSystem: workspace.fileSystem, rootPath: workspace.rootPath }),
	);
	const store = supplied ?? local;
	const identity = useRef({
		fileSystem: workspace.fileSystem,
		id: workspace.id,
		revision: workspace.revision,
		rootPath: workspace.rootPath,
	});
	useEffect(() => {
		const previous = identity.current;
		const backendChanged =
			previous.fileSystem !== workspace.fileSystem ||
			previous.id !== workspace.id ||
			previous.rootPath !== workspace.rootPath;
		identity.current = {
			fileSystem: workspace.fileSystem,
			id: workspace.id,
			revision: workspace.revision,
			rootPath: workspace.rootPath,
		};
		if (backendChanged) store.getState().actions.replaceFileSystem(workspace.fileSystem, workspace.rootPath);
		else if (previous.revision !== workspace.revision) store.getState().actions.refresh();
	}, [store, workspace.fileSystem, workspace.id, workspace.revision, workspace.rootPath]);
	return store;
}
