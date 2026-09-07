import { describe, expect, it } from 'vite-plus/test';
import type { AgentTerminalEntry } from './command-types';
import {
	appendAgentTerminalEntry,
	appendCompletedAgentTerminalEntry,
	completeAgentTerminalEntry,
	MaxAgentTerminalEntries,
} from './terminal-history';

function runningEntry(index: number): AgentTerminalEntry {
	return {
		command: `command-${index}`,
		id: `entry-${index}`,
		startedAt: index,
		status: 'running',
	};
}

describe('bounded Agent terminal history', () => {
	it('evicts oldest entries while retaining the active newest entry', () => {
		let entries: AgentTerminalEntry[] = [];
		for (let index = 0; index <= MaxAgentTerminalEntries; index++) {
			entries = appendAgentTerminalEntry(entries, runningEntry(index));
		}
		expect(entries).toHaveLength(MaxAgentTerminalEntries);
		expect(entries[0]?.id).toBe('entry-1');
		expect(entries.at(-1)).toMatchObject({ id: `entry-${MaxAgentTerminalEntries}`, status: 'running' });
	});

	it('keeps completed busy entries bounded without leaving ghost running state', () => {
		let entries: AgentTerminalEntry[] = [];
		for (let index = 0; index < MaxAgentTerminalEntries + 5; index++) {
			entries = appendCompletedAgentTerminalEntry(
				entries,
				{ command: `busy-${index}`, id: `busy-${index}`, startedAt: index },
				{
					durationMs: 0,
					exitCode: 125,
					settled: true,
					stderr: '已有命令正在执行。\n',
					stdout: '',
					truncated: false,
				},
				index,
			);
		}
		expect(entries).toHaveLength(MaxAgentTerminalEntries);
		expect(entries[0]?.id).toBe('busy-5');
		expect(entries.every((entry) => entry.status === 'failed' && entry.result?.exitCode === 125)).toBe(true);
	});

	it('completes a retained newest entry after eviction', () => {
		let entries = Array.from({ length: MaxAgentTerminalEntries }, (_, index) => runningEntry(index));
		entries = appendAgentTerminalEntry(entries, runningEntry(MaxAgentTerminalEntries));
		entries = completeAgentTerminalEntry(
			entries,
			`entry-${MaxAgentTerminalEntries}`,
			{
				durationMs: 4,
				exitCode: 0,
				settled: true,
				stderr: '',
				stdout: 'done',
				truncated: false,
			},
			123,
		);
		expect(entries).toHaveLength(MaxAgentTerminalEntries);
		expect(entries.at(-1)).toMatchObject({
			finishedAt: 123,
			id: `entry-${MaxAgentTerminalEntries}`,
			status: 'succeeded',
		});
	});
});
