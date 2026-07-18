import type { ChatTransport, UIMessage } from 'ai';

export function bindAgentTransportGeneration<MESSAGE extends UIMessage>(
	transport: ChatTransport<MESSAGE>,
	generation: { current: number },
): ChatTransport<MESSAGE> {
	return {
		async reconnectToStream(options) {
			const current = generation.current;
			try {
				const stream = await transport.reconnectToStream(options);
				if (!stream) return null;
				return bindStreamGeneration(stream, current, generation);
			} catch (error) {
				if (generation.current !== current) return null;
				throw error;
			}
		},
		async sendMessages(options) {
			const current = generation.current;
			try {
				const stream = await transport.sendMessages(options);
				return bindStreamGeneration(stream, current, generation);
			} catch (error) {
				if (generation.current !== current) return emptyStream();
				throw error;
			}
		},
	};
}

function bindStreamGeneration<CHUNK>(
	stream: ReadableStream<CHUNK>,
	current: number,
	generation: { current: number },
): ReadableStream<CHUNK> {
	const reader = stream.getReader();
	return new ReadableStream<CHUNK>({
		async pull(controller) {
			if (generation.current !== current) {
				await reader.cancel('stale generation').catch(() => undefined);
				controller.close();
				return;
			}
			try {
				const result = await reader.read();
				if (generation.current !== current) {
					await reader.cancel('stale generation').catch(() => undefined);
					controller.close();
				} else if (result.done) controller.close();
				else controller.enqueue(result.value);
			} catch (error) {
				if (generation.current !== current) controller.close();
				else controller.error(error);
			}
		},
		cancel(reason) {
			return reader.cancel(reason);
		},
	});
}

function emptyStream<CHUNK>(): ReadableStream<CHUNK> {
	return new ReadableStream<CHUNK>({
		start(controller) {
			controller.close();
		},
	});
}
