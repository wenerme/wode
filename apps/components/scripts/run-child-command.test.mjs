import { EventEmitter } from 'node:events';
import assert from 'node:assert/strict';
import test from 'node:test';
import { runChildCommand } from './run-child-command.mjs';

test('hard-terminates a timed-out child and removes listeners', async () => {
	const child = new EventEmitter();
	child.killed = false;
	child.kill = (signal) => {
		child.killed = true;
		child.killSignal = signal;
		queueMicrotask(() => child.emit('close', null, signal));
		return true;
	};

	const promise = runChildCommand({
		command: 'fixture-command',
		arguments_: ['--wait'],
		cwd: process.cwd(),
		env: process.env,
		timeoutMs: 10,
		spawnImpl: () => child,
	});

	const rejection = assert.rejects(promise, /Command timed out after 10ms/);
	await new Promise((resolve) => setTimeout(resolve, 20));
	await rejection;
	assert.equal(child.killSignal, 'SIGKILL');
	assert.equal(child.listenerCount('error'), 0);
	assert.equal(child.listenerCount('close'), 0);
});
