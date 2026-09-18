import assert from 'node:assert/strict';
import test from 'node:test';
import { runSyncJsonCommand } from './run-sync-command.mjs';

test('hard-terminates a timed-out synchronous command', () => {
	assert.throws(
		() =>
			runSyncJsonCommand({
				command: process.execPath,
				arguments_: ['-e', 'setInterval(() => undefined, 1_000)'],
				cwd: process.cwd(),
				timeoutMs: 20,
			}),
		(error) => error?.code === 'ETIMEDOUT' && error?.signal === 'SIGKILL',
	);
});
