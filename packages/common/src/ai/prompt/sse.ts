export interface SseEvent {
	event?: string;
	data: string;
}

/** Parses the SSE framing used by all supported provider streaming APIs. */
export async function* readSse(stream: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<SseEvent> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let event: string | undefined;
	let data: string[] = [];
	let complete = false;
	let skipLf = false;

	const flush = (): SseEvent | undefined => {
		const output = data.length ? { ...(event === undefined ? {} : { event }), data: data.join('\n') } : undefined;
		event = undefined;
		data = [];
		return output;
	};
	const line = (value: string): SseEvent | undefined => {
		if (value === '') return flush();
		if (value.startsWith(':')) return undefined;
		const separator = value.indexOf(':');
		const field = separator < 0 ? value : value.slice(0, separator);
		const content = separator < 0 ? '' : value.slice(separator + 1).replace(/^ /, '');
		if (field === 'event') event = content;
		else if (field === 'data') data.push(content);
		return undefined;
	};

	const cancel = () => void reader.cancel().catch(() => undefined);
	signal?.addEventListener('abort', cancel, { once: true });
	if (signal?.aborted) cancel();
	try {
		while (true) {
			let next: ReadableStreamReadResult<Uint8Array>;
			try {
				next = await reader.read();
			} catch {
				throw new Error('Prompt provider stream read failed');
			}
			if (next.done) {
				complete = true;
				break;
			}
			buffer += decoder.decode(next.value, { stream: true });
			while (buffer.length) {
				if (skipLf) {
					if (buffer.startsWith('\n')) buffer = buffer.slice(1);
					skipLf = false;
				}
				const newline = buffer.search(/[\r\n]/u);
				if (newline < 0) break;
				const value = buffer.slice(0, newline);
				skipLf = buffer[newline] === '\r';
				buffer = buffer.slice(newline + 1);
				const output = line(value);
				if (output) yield output;
			}
		}
		buffer += decoder.decode();
		if (buffer) {
			const output = line(buffer);
			if (output) yield output;
		}
		const output = flush();
		if (output) yield output;
	} finally {
		signal?.removeEventListener('abort', cancel);
		if (!complete) await reader.cancel().catch(() => undefined);
		reader.releaseLock();
	}
}
