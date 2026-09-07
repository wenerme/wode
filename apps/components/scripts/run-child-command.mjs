import { spawn } from 'node:child_process';

export const childCommandTimeoutMs = 120_000;

export function runChildCommand({
	command,
	arguments_,
	cwd,
	env,
	timeoutMs = childCommandTimeoutMs,
	spawnImpl = spawn,
}) {
	return new Promise((resolve, reject) => {
		const signal = AbortSignal.timeout(timeoutMs);
		let child;
		let timedOut = false;
		let settled = false;

		const finish = (callback, value) => {
			if (settled) return;
			settled = true;
			signal.removeEventListener('abort', onAbort);
			child?.removeListener('error', onError);
			child?.removeListener('close', onClose);
			callback(value);
		};
		const onAbort = () => {
			timedOut = true;
			if (!child?.killed) child?.kill('SIGKILL');
		};
		const onError = (error) => {
			if (!timedOut) finish(reject, error);
		};
		const onClose = (code) => {
			if (timedOut) {
				finish(reject, new Error(`Command timed out after ${timeoutMs}ms: ${command} ${arguments_.join(' ')}`));
			} else if (code === 0) finish(resolve);
			else finish(reject, new Error(`Command failed (${code ?? 'unknown'}): ${command} ${arguments_.join(' ')}`));
		};

		try {
			child = spawnImpl(command, arguments_, { cwd, env, stdio: 'inherit' });
			signal.addEventListener('abort', onAbort, { once: true });
			child.once('error', onError);
			child.once('close', onClose);
			if (signal.aborted) onAbort();
		} catch (error) {
			finish(reject, error);
		}
	});
}
