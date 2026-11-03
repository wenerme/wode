export interface CliStreamIO {
	/** UTF-8 bytes from the host; the CLI never reads global stdin. */
	readonly stdinStream?: ReadableStream<Uint8Array>;
	/** Complete line-oriented output. */
	readonly stdoutStream?: WritableStream<Uint8Array>;
	/** Incremental output without an implicit newline. */
	readonly writeStream?: WritableStream<Uint8Array>;
	/** Diagnostic output. */
	readonly stderrStream?: WritableStream<Uint8Array>;
}

/** 宿主负责实际读写；渲染器只生成文本，命令执行器不访问进程 stdio。 */
export interface CliIO {
	readonly stdin?: string;
	readonly stdinStream?: ReadableStream<Uint8Array>;
	stdout(text: string): void;
	readonly stdoutStream?: WritableStream<Uint8Array>;
	/** 可选无换行写入，用于逐块流式输出。 */
	write?(text: string): void;
	readonly writeStream?: WritableStream<Uint8Array>;
	stderr?(text: string): void;
	readonly stderrStream?: WritableStream<Uint8Array>;
}

export interface CliStreamIOOptions extends CliStreamIO {
	readonly encoder?: TextEncoder;
}

/** Adapt Web WritableStreams to the synchronous callback shape used by commands. */
export function createCliIOFromStreams(streams: CliStreamIOOptions): CliIO & { flush(): Promise<void> } {
	const encoder = streams.encoder ?? new TextEncoder();
	let pending = Promise.resolve();
	const writers = new Map<WritableStream<Uint8Array>, WritableStreamDefaultWriter<Uint8Array>>();
	const emit = (stream: WritableStream<Uint8Array> | undefined, text: string): void => {
		if (!stream) return;
		const writer = writers.get(stream) ?? stream.getWriter();
		writers.set(stream, writer);
		pending = pending.then(() => writer.write(encoder.encode(text)));
	};
	return {
		stdinStream: streams.stdinStream,
		stdoutStream: streams.stdoutStream,
		writeStream: streams.writeStream,
		stderrStream: streams.stderrStream,
		stdout: (text) => emit(streams.stdoutStream, text),
		write: (text) => emit(streams.writeStream ?? streams.stdoutStream, text),
		stderr: (text) => emit(streams.stderrStream, text),
		async flush() {
			await pending;
			await Promise.all([...writers.values()].map((writer) => writer.ready));
		},
	};
}

/** Read the optional byte-stream stdin without requiring a Node stream adapter. */
export async function readCliStdin(
	io: Pick<CliIO, 'stdin' | 'stdinStream'>,
	options: { signal?: AbortSignal } = {},
): Promise<string | undefined> {
	if (io.stdin !== undefined) return io.stdin;
	if (!io.stdinStream) return undefined;
	const reader = io.stdinStream.getReader();
	const decoder = new TextDecoder();
	try {
		let value = '';
		while (true) {
			options.signal?.throwIfAborted();
			const chunk = await reader.read();
			if (chunk.done) return value + decoder.decode();
			value += decoder.decode(chunk.value, { stream: true });
		}
	} finally {
		reader.releaseLock();
	}
}
