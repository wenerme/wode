'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Persona } from '@wener/ai/agent/persona';
import type { Skill } from '@wener/ai/agent/skill';
import { createMemoryFileSystem, type IFileStat, type MemoryFileSystemDirectory } from '@wener/common/fs';
import type { JustBashModule, JustBashModuleLoader } from '@wener/common/fs/just-bash';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { AgentCommandExecutor } from '../../registry/default/blocks/agent-coding';
import { AgentPlayground } from '../../registry/default/blocks/agent-playground';

const meta = {
	excludeStories: ['loadStoryJustBashBrowser'],
	title: 'Agent/Work Coding Playground',
	parameters: { controls: { disable: true }, layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const CompleteMock: Story = {
	render: () => {
		const fileSystem = createFixtureFileSystem();
		return (
			<main className='bg-base-200 h-screen min-h-[48rem] p-2 md:p-4'>
				<AgentPlayground
					className='mx-auto max-w-[96rem]'
					executor={createFixtureExecutor(fileSystem)}
					fetch={createMockAgentFetch()}
					fileSystem={fileSystem}
					initialConnection={{ apiKey: '', baseUrl: 'https://example.com/v1', headers: {}, model: 'example-model' }}
					initialConnectionApplied
					personas={fixturePersonas}
					rootPath='/workspace'
					skills={fixtureSkills}
					workspaceId='example-workspace'
				/>
			</main>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByText('上下文就绪')).toBeInTheDocument());
		await openWorkspacePaneIfNarrow(canvas);
		await userEvent.click(canvas.getByRole('tab', { name: '上下文' }));
		await expect(canvas.getByText('所有变更保持可验证。')).toBeInTheDocument();
		await expect(canvas.getByText('先读取相关文件，再进行聚焦修改。')).toBeInTheDocument();

		await openChatPaneIfNarrow(canvas);
		await sendChat(canvas, '列出工作区文件');
		await waitFor(() => expect(canvas.getByText('只读文件列表已完成。')).toBeInTheDocument());

		await userEvent.click(canvas.getByRole('button', { name: '编码' }));
		await openChatPaneIfNarrow(canvas);
		await sendChat(canvas, '写入文件');
		const approve = await canvas.findByRole('button', { name: '批准' });
		await userEvent.click(approve);
		await openWorkspacePaneIfNarrow(canvas);
		await userEvent.click(canvas.getByRole('tab', { name: '文件' }));
		await waitFor(() => expect(canvas.getByRole('button', { name: 'approved.ts' })).toBeInTheDocument());

		await userEvent.click(canvas.getByRole('tab', { name: '终端' }));
		await userEvent.type(canvas.getByRole('textbox', { name: '命令' }), 'create-demo-file');
		await userEvent.click(canvas.getByRole('button', { name: '运行命令' }));
		await waitFor(() => expect(canvas.getByText(/fixture command complete/iu)).toBeInTheDocument());
		await userEvent.click(canvas.getByRole('tab', { name: '文件' }));
		await waitFor(() => expect(canvas.getByRole('button', { name: 'generated-by-bash.txt' })).toBeInTheDocument());

		await openChatPaneIfNarrow(canvas);
		await sendChat(canvas, '拒绝写入');
		const deny = await canvas.findByRole('button', { name: '拒绝' });
		await userEvent.click(deny);
		await waitFor(() => expect(canvas.getByText('已拒绝')).toBeInTheDocument());
		await waitForChatReady(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: '刷新工作区' }));
		await waitForChatReady(canvasElement);
	},
};

export const LiveOpenAICompatible: Story = {
	render: () => (
		<main className='bg-base-200 h-screen min-h-[48rem] p-2 md:p-4'>
			<AgentPlayground
				className='mx-auto max-w-[96rem]'
				fileSystem={createFixtureFileSystem()}
				justBashLoader={loadStoryJustBashBrowser}
				personas={fixturePersonas}
				rootPath='/workspace'
				skills={fixtureSkills}
				workspaceId='live-workspace'
			/>
		</main>
	),
};

export const loadStoryJustBashBrowser: JustBashModuleLoader = async () => {
	const moduleUrl = 'https://esm.sh/just-bash@3.1.0/browser?bundle';
	const loaded: unknown = await import(/* @vite-ignore */ moduleUrl);
	if (!isRecord(loaded) || typeof loaded.Bash !== 'function') throw new Error('just-bash browser module is invalid');
	return { Bash: loaded.Bash as JustBashModule['Bash'] };
};

function createFixtureFileSystem() {
	return createMemoryFileSystem({
		root: directory('', '/', [
			directory('workspace', '/workspace', [
				file('AGENTS.md', '/workspace', '所有变更保持可验证。'),
				directory('src', '/workspace/src', [file('index.ts', '/workspace/src', "export const greeting = 'hello';\n")]),
				directory('skill', '/workspace/skill', [file('review.md', '/workspace/skill', '先读取相关文件。')]),
			]),
		]),
	});
}

function createFixtureExecutor(fileSystem: ReturnType<typeof createFixtureFileSystem>): AgentCommandExecutor {
	return {
		async execute({ command }, { signal } = {}) {
			if (signal?.aborted) return terminalResult('', 'cancelled\n', 130, true);
			if (command !== 'create-demo-file') return terminalResult('', `unsupported fixture command: ${command}\n`, 127);
			await fileSystem.writeFile('/workspace/generated-by-bash.txt', 'created by the fixture executor\n', { signal });
			return { ...terminalResult('fixture command complete\n', '', 0), workspaceChanged: true };
		},
	};
}

function terminalResult(stdout: string, stderr: string, exitCode: number, aborted = false) {
	return { aborted, durationMs: 2, exitCode, settled: true, stderr, stdout, truncated: false };
}

function createMockAgentFetch(): typeof globalThis.fetch {
	let call = 0;
	return async (input, init) => {
		const body = await readRequestBody(input, init);
		const messages = Array.isArray(body.messages) ? body.messages : [];
		const hasToolResult = hasToolResultAfterLastUser(messages);
		const prompt = lastUserText(messages);
		if (hasToolResult) {
			return streamTextResponse(prompt.includes('列出') ? '只读文件列表已完成。' : '写入已完成。');
		}
		if (prompt.includes('列出')) return streamToolResponse(`call-list-${++call}`, 'workspace_list', { path: '.' });
		if (prompt.includes('拒绝'))
			return streamToolResponse(`call-deny-${++call}`, 'workspace_write', { content: 'denied\n', path: 'denied.ts' });
		if (prompt.includes('写入'))
			return streamToolResponse(`call-write-${++call}`, 'workspace_write', {
				content: 'export const approved = true;\n',
				path: 'approved.ts',
			});
		return streamTextResponse('Mock 响应完成。');
	};
}

async function readRequestBody(input: RequestInfo | URL, init?: RequestInit): Promise<Record<string, unknown>> {
	try {
		const raw = input instanceof Request ? await input.clone().text() : typeof init?.body === 'string' ? init.body : '';
		const parsed: unknown = JSON.parse(raw);
		return isRecord(parsed) ? parsed : {};
	} catch {
		return {};
	}
}

function hasToolResultAfterLastUser(messages: unknown[]): boolean {
	let lastUser = -1;
	for (let index = messages.length - 1; index >= 0; index--) {
		const candidate = messages[index];
		if (isRecord(candidate) && candidate.role === 'user') {
			lastUser = index;
			break;
		}
	}
	return messages.slice(lastUser + 1).some((message) => isRecord(message) && message.role === 'tool');
}

function lastUserText(messages: unknown[]): string {
	for (let index = messages.length - 1; index >= 0; index--) {
		const candidate = messages[index];
		if (!isRecord(candidate) || candidate.role !== 'user') continue;
		const content = candidate.content;
		if (typeof content === 'string') return content;
		if (Array.isArray(content))
			return content
				.flatMap((part: unknown) => (isRecord(part) && typeof part.text === 'string' ? [part.text] : []))
				.join(' ');
	}
	return '';
}

function streamToolResponse(id: string, name: string, args: Record<string, unknown>): Response {
	return sseResponse([
		chunk(
			{
				role: 'assistant',
				tool_calls: [{ function: { arguments: JSON.stringify(args), name }, id, index: 0, type: 'function' }],
			},
			null,
		),
		chunk({}, 'tool_calls'),
	]);
}

function streamTextResponse(text: string): Response {
	return sseResponse([chunk({ content: text, role: 'assistant' }, null), chunk({}, 'stop')]);
}

function chunk(delta: Record<string, unknown>, finishReason: string | null) {
	return {
		choices: [{ delta, finish_reason: finishReason, index: 0 }],
		created: 1,
		id: 'chatcmpl-mock',
		model: 'example-model',
		object: 'chat.completion.chunk',
	};
}

function sseResponse(events: readonly Record<string, unknown>[]): Response {
	const body = [...events.map((event) => `data: ${JSON.stringify(event)}\n\n`), 'data: [DONE]\n\n'].join('');
	return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
}

async function sendChat(canvas: ReturnType<typeof within>, text: string) {
	const input = canvas.getByRole('textbox', { name: '输入消息…' });
	await userEvent.type(input, text);
	await userEvent.click(canvas.getByRole('button', { name: '发送' }));
}

async function waitForChatReady(canvasElement: HTMLElement) {
	await waitFor(() =>
		expect(canvasElement.querySelector('[data-slot="agent-chat"]')?.getAttribute('data-status')).toBe('ready'),
	);
}

async function openWorkspacePaneIfNarrow(canvas: ReturnType<typeof within>) {
	const panes = canvas.queryByRole('group', { name: '工作模式面板' });
	if (panes) await userEvent.click(within(panes).getByRole('button', { name: '工作区' }));
}

async function openChatPaneIfNarrow(canvas: ReturnType<typeof within>) {
	const panes = canvas.queryByRole('group', { name: '工作模式面板' });
	if (panes) await userEvent.click(within(panes).getByRole('button', { name: '对话' }));
}

function directory(
	name: string,
	path: string,
	children: MemoryFileSystemDirectory['children'],
	rootPath = path,
): MemoryFileSystemDirectory {
	return {
		children,
		directory: path === rootPath ? '/' : rootPath,
		kind: 'directory',
		meta: {},
		mtime: 0,
		name,
		path,
		size: 0,
	};
}

function file(name: string, directoryPath: string, content: string): IFileStat & { content: string; kind: 'file' } {
	return {
		content,
		directory: directoryPath,
		kind: 'file',
		meta: {},
		mtime: 0,
		name,
		path: `${directoryPath}/${name}`.replace('//', '/'),
		size: new TextEncoder().encode(content).byteLength,
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const fixturePersonas: Persona[] = [
	{ assets: [], greetings: [], id: 'reviewer', name: 'Reviewer', prompts: { system: '保持回答具体。' }, version: '1' },
];
const fixtureSkills: Skill[] = [
	{
		contextRequirements: [],
		description: '聚焦工作区修改',
		instructions: '先读取相关文件，再进行聚焦修改。',
		name: 'focused-change',
		resources: [],
		toolRequirements: [],
		version: '1',
	},
];
