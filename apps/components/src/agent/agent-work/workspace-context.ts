import { getSkillIdentity, type Skill } from '@wener/ai/agent/skill';
import { resolveAgentWorkspacePath } from './workspace-path';
import {
	type AgentWorkspaceContext,
	type AgentWorkspaceContextIssue,
	type AgentWorkspaceContextLimits,
	defaultAgentWorkspaceContextLimits,
	type LoadAgentWorkspaceContextOptions,
} from './workspace-types';

export async function loadAgentWorkspaceContext({
	agentsPath = 'AGENTS.md',
	limits: inputLimits,
	signal,
	skills,
	workspace,
}: LoadAgentWorkspaceContextOptions): Promise<AgentWorkspaceContext> {
	const limits = resolveContextLimits(inputLimits);
	throwIfAborted(signal);
	const issues: AgentWorkspaceContextIssue[] = [];
	let aggregateBytes = 0;
	let agents: AgentWorkspaceContext['agents'];
	const resolvedAgentsPath = resolveAgentWorkspacePath(workspace.rootPath, agentsPath);
	try {
		const bytes = await workspace.fileSystem.readFile(resolvedAgentsPath, {
			encoding: 'binary',
			maxBytes: limits.maxAgentsBytes + 1,
			signal,
		});
		throwIfAborted(signal);
		if (bytes.byteLength > limits.maxAgentsBytes) {
			issues.push({
				code: 'agents-too-large',
				message: `AGENTS 文件超过 ${limits.maxAgentsBytes} 字节，已整体排除。`,
				path: resolvedAgentsPath,
			});
		} else if (bytes.byteLength > limits.maxAggregateBytes) {
			issues.push({
				code: 'aggregate-too-large',
				message: 'AGENTS 文件超过工作区上下文总量限制，已整体排除。',
				path: resolvedAgentsPath,
			});
		} else {
			const content = decodeUtf8(bytes, resolvedAgentsPath, issues);
			if (content !== undefined) {
				aggregateBytes += bytes.byteLength;
				agents = { bytes: bytes.byteLength, content, path: resolvedAgentsPath };
			}
		}
	} catch (error) {
		if (isAbortError(error) || signal?.aborted) throw createAbortError();
		if (!isNotFoundError(error)) {
			issues.push({
				code: 'agents-read-failed',
				message: `读取 AGENTS 文件失败：${toErrorMessage(error)}`,
				path: resolvedAgentsPath,
			});
		}
	}

	const selectedSkills: AgentWorkspaceContext['skills'] = [];
	if (skills.length > limits.maxSkills) {
		issues.push({
			code: 'skill-count-exceeded',
			message: `最多加载 ${limits.maxSkills} 个 Skill，其余已排除。`,
		});
	}
	for (const skill of skills.slice(0, limits.maxSkills)) {
		throwIfAborted(signal);
		const descriptionBytes = utf8Bytes(skill.description);
		const instructionBytes = utf8Bytes(skill.instructions);
		const bytes = descriptionBytes + instructionBytes;
		if (descriptionBytes > limits.maxSkillBytes || instructionBytes > limits.maxSkillBytes) {
			issues.push(
				skillIssue('skill-too-large', skill, `Skill 的描述或指令超过 ${limits.maxSkillBytes} 字节，已整体排除。`),
			);
			continue;
		}
		if (aggregateBytes + bytes > limits.maxAggregateBytes) {
			issues.push(skillIssue('aggregate-too-large', skill, 'Skill 超过工作区上下文总量限制，已整体排除。'));
			continue;
		}
		aggregateBytes += bytes;
		selectedSkills.push({
			bytes,
			description: skill.description,
			identity: getSkillIdentity(skill),
			instructions: skill.instructions,
			name: skill.name,
			version: skill.version,
		});
	}
	throwIfAborted(signal);
	return {
		agents,
		bytes: aggregateBytes,
		issues,
		skills: selectedSkills,
		workspaceId: workspace.id,
		workspaceRevision: workspace.revision,
	};
}

function resolveContextLimits(input?: Partial<AgentWorkspaceContextLimits>): AgentWorkspaceContextLimits {
	const limits = { ...defaultAgentWorkspaceContextLimits, ...input };
	for (const [name, value] of Object.entries(limits)) {
		if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} 必须是正整数。`);
	}
	return limits;
}

function skillIssue(
	code: 'aggregate-too-large' | 'skill-too-large',
	skill: Skill,
	message: string,
): AgentWorkspaceContextIssue {
	return { code, message, skillIdentity: getSkillIdentity(skill), skillName: skill.name };
}

function decodeUtf8(bytes: Uint8Array, path: string, issues: AgentWorkspaceContextIssue[]): string | undefined {
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
	} catch {
		issues.push({ code: 'invalid-text', message: 'AGENTS 文件不是有效的 UTF-8 文本，已整体排除。', path });
		return undefined;
	}
}

function isNotFoundError(error: unknown): boolean {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function isAbortError(error: unknown): boolean {
	return error instanceof DOMException
		? error.name === 'AbortError'
		: error instanceof Error && error.name === 'AbortError';
}

function throwIfAborted(signal?: AbortSignal): void {
	if (signal?.aborted) throw createAbortError();
}

function createAbortError(): Error {
	return typeof DOMException === 'function'
		? new DOMException('上下文加载已取消。', 'AbortError')
		: Object.assign(new Error('上下文加载已取消。'), { name: 'AbortError' });
}

function toErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function utf8Bytes(value: string): number {
	return new TextEncoder().encode(value).byteLength;
}
