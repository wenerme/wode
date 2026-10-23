import { describe, expect, it } from 'vitest';
import { createCliIOFromStreams, readCliStdin } from './CliIO';

describe('createCliIOFromStreams', () => {
	it('serializes callback output into UTF-8 Web Stream writes', async () => {
		const chunks: Uint8Array[] = [];
		const stream = new WritableStream<Uint8Array>({ write: (chunk) => void chunks.push(chunk) });
		const io = createCliIOFromStreams({ stdoutStream: stream, writeStream: stream });
		io.stdout('héllo\n');
		io.write?.('tail');
		await io.flush();
		expect(new TextDecoder().decode(new Uint8Array(chunks.flatMap((chunk) => [...chunk])))).toBe('héllo\ntail');
	});

	it('keeps incremental and complete output streams separate', async () => {
		const stdout: string[] = [];
		const writes: string[] = [];
		const decode = (target: string[]) =>
			new WritableStream<Uint8Array>({ write: (chunk) => void target.push(new TextDecoder().decode(chunk)) });
		const io = createCliIOFromStreams({ stdoutStream: decode(stdout), writeStream: decode(writes) });
		io.stdout('line\n');
		io.write?.('chunk');
		await io.flush();
		expect(stdout).toEqual(['line\n']);
		expect(writes).toEqual(['chunk']);
	});

	it('reads UTF-8 stdin from a Web ReadableStream', async () => {
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('hé'));
				controller.enqueue(new TextEncoder().encode('llo'));
				controller.close();
			},
		});
		expect(await readCliStdin({ stdinStream: stream })).toBe('héllo');
	});
});
