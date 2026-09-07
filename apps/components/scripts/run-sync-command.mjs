import { execFileSync } from 'node:child_process';
import { childCommandTimeoutMs } from './run-child-command.mjs';

export function runSyncJsonCommand({
	command,
	arguments_,
	cwd,
	timeoutMs = childCommandTimeoutMs,
	execFileSyncImpl = execFileSync,
}) {
	return JSON.parse(
		execFileSyncImpl(command, arguments_, {
			cwd,
			encoding: 'utf8',
			killSignal: 'SIGKILL',
			maxBuffer: 16 * 1024 * 1024,
			timeout: timeoutMs,
		}),
	);
}
