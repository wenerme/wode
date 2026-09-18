import type { JustBashAgentSession } from '@wener/common/fs/just-bash';
import type { AgentCommandExecutor } from './command-types';

export function createJustBashCommandExecutor(session: JustBashAgentSession): AgentCommandExecutor {
	return {
		async execute({ command, stdin }, { signal } = {}) {
			const result = await session.exec(command, { signal, stdin });
			return {
				aborted: result.aborted,
				durationMs: result.durationMs,
				exitCode: result.exitCode,
				mutationMayContinue: result.mutationMayContinue,
				poisoned: result.poisoned,
				settled: result.settled,
				stderr: result.stderr,
				stdout: result.stdout,
				timedOut: result.timedOut,
				truncated: result.truncated,
				workspaceChanged: result.workspaceChanged,
			};
		},
	};
}
