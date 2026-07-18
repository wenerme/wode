import type { Skill } from '@wener/ai/agent/skill';
import { createMemoryFileSystem, type IFileSystem } from '@wener/common/fs';
import { describe, expect, it } from 'vite-plus/test';
import { composeAgentInstructions } from './instruction-composer';
import { loadAgentWorkspaceContext } from './workspace-context';
import type { AgentWorkspace } from './workspace-types';

const skill = (name: string, description = '描述', instructions = '执行指令'): Skill => ({
	description,
	instructions,
	name,
	resources: [],
	contextRequirements: [],
	toolRequirements: [],
	version: '1.0.0',
});

async function workspaceWith(files: Record<string, string> = {}): Promise<AgentWorkspace> {
	const fileSystem = createMemoryFileSystem();
	for (const [path, content] of Object.entries(files)) await fileSystem.writeFile(path, content);
	return { fileSystem, id: 'workspace-a', rootPath: '/' };
}

describe('loadAgentWorkspaceContext', () => {
	it('loads binary AGENTS and only explicit skills within fixed limits', async () => {
		const workspace = await workspaceWith({ '/AGENTS.md': '保持变更聚焦。', '/SKILL.md': '不得自动发现' });
		const result = await loadAgentWorkspaceContext({ skills: [skill('review')], workspace });
		expect(result.agents?.content).toBe('保持变更聚焦。');
		expect(result.skills.map((item) => item.name)).toEqual(['review']);
		expect(result.issues).toEqual([]);
	});

	it('preserves canonical identity for same-name and same-version Skills', async () => {
		const base = skill('review');
		const result = await loadAgentWorkspaceContext({
			skills: [
				{ ...base, id: 'skill-a', instructions: 'First' },
				{ ...base, id: 'skill-b', instructions: 'Second' },
			],
			workspace: await workspaceWith(),
		});
		expect(result.skills.map((item) => item.identity)).toEqual(['id:skill-a', 'id:skill-b']);
		expect(composeAgentInstructions({ context: result }).included).toEqual(['skill:id:skill-a', 'skill:id:skill-b']);
	});

	it('treats ENOENT as absent while surfacing other adapter errors', async () => {
		const absent = await loadAgentWorkspaceContext({ skills: [], workspace: await workspaceWith() });
		expect(absent.agents).toBeUndefined();
		expect(absent.issues).toEqual([]);
		const base = await workspaceWith();
		const denied = {
			...base.fileSystem,
			readFile: async () => {
				throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
			},
		} as IFileSystem;
		const failed = await loadAgentWorkspaceContext({
			skills: [],
			workspace: { ...base, fileSystem: denied },
		});
		expect(failed.issues).toEqual([expect.objectContaining({ code: 'agents-read-failed' })]);
		expect(failed.issues[0]?.message).toContain('permission denied');
	});

	it('excludes oversized AGENTS and skills whole and enforces aggregate/count limits', async () => {
		const workspace = await workspaceWith({ '/AGENTS.md': 'a'.repeat(9) });
		const result = await loadAgentWorkspaceContext({
			limits: { maxAgentsBytes: 8, maxAggregateBytes: 20, maxSkillBytes: 8, maxSkills: 2 },
			skills: [skill('large', '123456789', 'ok'), skill('fits', '1234', '5678'), skill('extra')],
			workspace,
		});
		expect(result.agents).toBeUndefined();
		expect(result.skills.map((item) => item.name)).toEqual(['fits']);
		expect(result.issues.map((issue) => issue.code)).toEqual([
			'agents-too-large',
			'skill-count-exceeded',
			'skill-too-large',
		]);
	});

	it('rejects pre-aborted and in-flight aborted loads', async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(
			loadAgentWorkspaceContext({ signal: controller.signal, skills: [], workspace: await workspaceWith() }),
		).rejects.toMatchObject({ name: 'AbortError' });
		const delayed = await workspaceWith();
		const second = new AbortController();
		const fileSystem = {
			...delayed.fileSystem,
			readFile: async (_path: string, options?: { signal?: AbortSignal }) =>
				new Promise<Uint8Array>((_resolve, reject) => {
					options?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), {
						once: true,
					});
				}),
		} as IFileSystem;
		const request = loadAgentWorkspaceContext({
			signal: second.signal,
			skills: [],
			workspace: { ...delayed, fileSystem },
		});
		second.abort();
		await expect(request).rejects.toMatchObject({ name: 'AbortError' });
	});
});

describe('composeAgentInstructions', () => {
	it('uses fixed whole-section separators for persona, AGENTS and skills', async () => {
		const context = await loadAgentWorkspaceContext({
			skills: [skill('review')],
			workspace: await workspaceWith({ '/AGENTS.md': 'Workspace rules' }),
		});
		const result = composeAgentInstructions({
			context,
			persona: { assets: [], greetings: [], id: 'p', name: 'Helper', prompts: { system: 'Be precise' }, version: '1' },
		});
		expect(result.included).toEqual(['persona', 'agents', 'skill:name-version:["review","1.0.0"]']);
		expect(result.instructions.split('\n\n---\n\n')).toHaveLength(3);
	});

	it('excludes a complete section when the composer aggregate cap is reached', async () => {
		const context = await loadAgentWorkspaceContext({
			skills: [skill('review')],
			workspace: await workspaceWith({ '/AGENTS.md': 'Workspace rules' }),
		});
		const result = composeAgentInstructions({ context, maxBytes: 40 });
		expect(result.included.length).toBeLessThan(2);
		expect(result.issues.some((issue) => issue.code === 'aggregate-too-large')).toBe(true);
	});
});
