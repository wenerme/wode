import type { Persona } from '@wener/ai/agent/persona';
import { getSkillIdentity, type Skill } from '@wener/ai/agent/skill';
import { createMemoryFileSystem } from '@wener/common/fs';
import { describe, expect, it } from 'vite-plus/test';
import { createAgentCommandRuntime } from '../agent-coding';
import type { AgentWorkspaceContext } from '../agent-work';
import { createAgentPlaygroundRuntimeConfiguration } from './playground-runtime';

const persona: Persona = {
	assets: [],
	greetings: [],
	id: 'persona-a',
	name: 'Reviewer',
	prompts: { system: 'Persona only instruction' },
	version: '1',
};
const skill: Skill = {
	contextRequirements: [],
	description: 'Workspace skill description',
	instructions: 'Workspace skill instructions',
	name: 'WorkspaceSkill',
	resources: [],
	toolRequirements: [],
	version: '1',
};
const context: AgentWorkspaceContext = {
	agents: { bytes: 14, content: 'Workspace AGENTS', path: '/AGENTS.md' },
	bytes: 40,
	issues: [],
	skills: [{ ...skill, bytes: 26, identity: getSkillIdentity(skill) }],
	workspaceId: 'workspace',
};
const workspace = { fileSystem: createMemoryFileSystem(), id: 'workspace', rootPath: '/' };

describe('Agent Playground runtime modes', () => {
	it('keeps Chat persona-only with no workspace tools or instructions', () => {
		const runtime = createAgentPlaygroundRuntimeConfiguration({ context, mode: 'chat', persona, workspace });
		expect(runtime.instructions).toContain('Persona only instruction');
		expect(runtime.instructions).not.toMatch(/Workspace AGENTS|Workspace skill/iu);
		expect(runtime.tools).toBeUndefined();
	});

	it('adds only read-only workspace tools in Work', () => {
		const runtime = createAgentPlaygroundRuntimeConfiguration({ context, mode: 'work', persona, workspace });
		expect(runtime.instructions).toMatch(/Workspace AGENTS|Workspace skill instructions/iu);
		expect(Object.keys(runtime.tools ?? {}).sort()).toEqual(['workspace_list', 'workspace_read']);
	});

	it('adds approval-gated write and bash in Coding', () => {
		const commandRuntime = createAgentCommandRuntime({
			execute: async () => ({ durationMs: 1, exitCode: 0, settled: true, stderr: '', stdout: '', truncated: false }),
		});
		const runtime = createAgentPlaygroundRuntimeConfiguration({
			commandRuntime,
			context,
			mode: 'coding',
			persona,
			workspace,
		});
		expect(Object.keys(runtime.tools ?? {}).sort()).toEqual([
			'bash',
			'workspace_list',
			'workspace_read',
			'workspace_write',
		]);
		expect(runtime.tools?.bash?.needsApproval).toBe(true);
		expect(runtime.tools?.workspace_write?.needsApproval).toBe(true);
	});
});
