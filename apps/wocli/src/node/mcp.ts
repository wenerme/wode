import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import type { CliMcpServerConfig } from 'common/context';
import { MCP_CLIENT_INFO } from '../const';

export interface McpTool extends Record<string, unknown> {
	name: string;
	description?: string;
	inputSchema?: Record<string, unknown>;
	annotations?: Record<string, unknown>;
}

export interface McpResource extends Record<string, unknown> {
	uri: string;
	name?: string;
	description?: string;
	mimeType?: string;
}

export interface McpConnection {
	readonly serverInfo?: Record<string, unknown>;
	listTools(signal: AbortSignal): Promise<McpTool[]>;
	listResources(signal: AbortSignal): Promise<McpResource[]>;
	readResource(uri: string, signal: AbortSignal): Promise<unknown>;
	callTool(name: string, args: Record<string, unknown>, signal: AbortSignal): Promise<unknown>;
	close(): Promise<void>;
}

interface JsonRpcResponse {
	jsonrpc?: string;
	id?: string | number;
	result?: any;
	error?: { code?: number; message?: string; data?: unknown };
}

interface JsonRpcMessage {
	jsonrpc: '2.0';
	id?: number;
	method: string;
	params?: Record<string, unknown>;
}

const PROTOCOL_VERSION = '2025-03-26';

export async function connectMcpServer(config: CliMcpServerConfig, signal: AbortSignal): Promise<McpConnection> {
	if (config.enabled === false) throw new Error('MCP server is disabled');
	if (config.transport === 'http') return connectHttpMcp(config, signal);
	return connectStdioMcp(config, signal);
}

class JsonRpcClient {
	private nextId = 1;
	private readonly pending = new Map<number, { resolve: (value: any) => void; reject: (error: unknown) => void }>();
	private closed = false;

	constructor(
		private readonly sendMessage: (message: JsonRpcMessage) => Promise<void>,
		private readonly closeTransport: () => Promise<void>,
	) {}

	async request(
		method: string,
		params: Record<string, unknown> | undefined,
		signal: AbortSignal,
		timeout?: number,
	): Promise<any> {
		if (this.closed) throw new Error('MCP connection is closed');
		signal.throwIfAborted();
		const id = this.nextId++;
		const message: JsonRpcMessage = { jsonrpc: '2.0', id, method, ...(params ? { params } : {}) };
		let pendingReject: (error: unknown) => void = () => undefined;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const abort = () => {
			this.pending.delete(id);
			const error = signal.reason instanceof Error ? signal.reason : new Error('MCP request cancelled');
			pendingReject(error);
			clearTimeout(timer);
			void this.close().catch(() => undefined);
		};
		const result = new Promise<any>((resolve, reject) => {
			pendingReject = reject;
			this.pending.set(id, { resolve, reject });
		});
		void result.catch(() => undefined);
		signal.addEventListener('abort', abort, { once: true });
		if (timeout)
			timer = setTimeout(() => {
				this.pending.delete(id);
				pendingReject(new Error('MCP request timed out'));
				void this.close().catch(() => undefined);
			}, timeout);
		try {
			await this.sendMessage(message);
			return await result;
		} catch (error) {
			this.pending.delete(id);
			pendingReject(error);
			throw error;
		} finally {
			signal.removeEventListener('abort', abort);
			clearTimeout(timer);
		}
	}

	resolve(message: JsonRpcResponse): void {
		if (typeof message.id !== 'number') return;
		const pending = this.pending.get(message.id);
		if (!pending) return;
		this.pending.delete(message.id);
		if (message.error) pending.reject(new Error(message.error.message ?? 'MCP request failed'));
		else pending.resolve(message.result);
	}

	async notify(method: string, params?: Record<string, unknown>): Promise<void> {
		await this.sendMessage({ jsonrpc: '2.0', method, ...(params ? { params } : {}) });
	}

	rejectAll(error: unknown): void {
		for (const pending of this.pending.values()) pending.reject(error);
		this.pending.clear();
	}

	async close(): Promise<void> {
		if (this.closed) return;
		this.closed = true;
		this.rejectAll(new Error('MCP connection closed'));
		await this.closeTransport();
	}
}

async function initialize(
	client: JsonRpcClient,
	signal: AbortSignal,
	timeout?: number,
): Promise<Record<string, unknown>> {
	const result = await client.request(
		'initialize',
		{
			protocolVersion: PROTOCOL_VERSION,
			capabilities: {},
			clientInfo: MCP_CLIENT_INFO,
		},
		signal,
		timeout,
	);
	await client.notify('notifications/initialized');
	return result ?? {};
}

function createConnection(
	client: JsonRpcClient,
	serverInfo: Record<string, unknown> | undefined,
	timeout: number | undefined,
): McpConnection {
	return {
		serverInfo,
		async listTools(signal) {
			const result = await client.request('tools/list', {}, signal, timeout);
			return Array.isArray(result?.tools) ? result.tools : [];
		},
		async listResources(signal) {
			const result = await client.request('resources/list', {}, signal, timeout);
			return Array.isArray(result?.resources) ? result.resources : [];
		},
		readResource(uri, signal) {
			return client.request('resources/read', { uri }, signal, timeout);
		},
		callTool(name, args, signal) {
			return client.request('tools/call', { name, arguments: args }, signal, timeout);
		},
		close: () => client.close(),
	};
}

async function connectStdioMcp(config: CliMcpServerConfig, signal: AbortSignal): Promise<McpConnection> {
	if (!config.command) throw new Error('MCP stdio server requires command');
	let child: ChildProcessWithoutNullStreams;
	let buffer = '';
	let closing = false;
	let client!: JsonRpcClient;
	const pendingStart: Array<JsonRpcResponse> = [];
	const onLine = (line: string) => {
		if (!line.trim()) return;
		let message: JsonRpcResponse;
		try {
			message = JSON.parse(line) as JsonRpcResponse;
		} catch {
			return;
		}
		if (client) client.resolve(message);
		else pendingStart.push(message);
	};
	child = spawn(config.command, config.args ?? [], {
		cwd: config.cwd,
		env: { ...process.env, ...(config.env ?? {}) },
		stdio: ['pipe', 'pipe', 'pipe'],
	});
	child.stdout.setEncoding('utf8');
	child.stderr.resume();
	child.stdout.on('data', (chunk: string) => {
		buffer += chunk;
		for (;;) {
			const index = buffer.indexOf('\n');
			if (index < 0) break;
			const line = buffer.slice(0, index);
			buffer = buffer.slice(index + 1);
			onLine(line);
		}
	});
	const transportError = new Promise<never>((_, reject) => {
		child.once('error', reject);
		child.once('exit', (code, detail) => {
			if (!closing) reject(new Error(`MCP server exited (${code ?? detail ?? 'unknown'})`));
		});
	});
	const send = async (message: JsonRpcMessage) => {
		if (!child.stdin.writable) throw new Error('MCP server stdin is closed');
		child.stdin.write(`${JSON.stringify(message)}\n`);
	};
	const close = async () => {
		closing = true;
		if (!child.killed) child.kill();
		child.stdin.destroy();
		child.stdout.destroy();
		child.stderr.destroy();
	};
	client = new JsonRpcClient(send, close);
	void transportError.catch((error) => client.rejectAll(error));
	try {
		const info = await Promise.race([initialize(client, signal, config.timeout ?? 30_000), transportError]);
		for (const message of pendingStart) client.resolve(message);
		return createConnection(client, info as Record<string, unknown>, config.timeout ?? 30_000);
	} catch (error) {
		await client.close();
		throw error;
	}
}

async function connectHttpMcp(config: CliMcpServerConfig, signal: AbortSignal): Promise<McpConnection> {
	if (!config.url) throw new Error('MCP HTTP server requires url');
	const endpoint = new URL(config.url);
	let sessionId: string | undefined;
	let activeController: AbortController | undefined;
	let activeReader: ReadableStreamDefaultReader<Uint8Array> | undefined;
	const headers = { accept: 'application/json, text/event-stream', ...(config.headers ?? {}) };
	const send = async (message: JsonRpcMessage): Promise<JsonRpcResponse> => {
		const controller = new AbortController();
		activeController = controller;
		const onAbort = () => controller.abort(signal.reason);
		signal.addEventListener('abort', onAbort, { once: true });
		const timer = setTimeout(() => controller.abort(new Error('MCP request timed out')), config.timeout ?? 30_000);
		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					...headers,
					...(sessionId ? { 'mcp-session-id': sessionId } : {}),
					'content-type': 'application/json',
				},
				body: JSON.stringify(message),
				signal: controller.signal,
			});
			const nextSession = response.headers.get('mcp-session-id');
			if (nextSession) sessionId = nextSession;
			if (!response.ok) throw new Error(`MCP HTTP ${response.status}`);
			const contentType = response.headers.get('content-type') ?? '';
			if (contentType.includes('text/event-stream') && response.body)
				return await readSseResponse(response.body, message.id, (reader) => {
					activeReader = reader;
				});
			const text = await response.text();
			return parseHttpResponse(text, message.id, contentType);
		} finally {
			activeReader = undefined;
			activeController = undefined;
			signal.removeEventListener('abort', onAbort);
			clearTimeout(timer);
		}
	};
	const client = new JsonRpcClient(
		async (message) => {
			const response = await send(message);
			client.resolve(response);
		},
		async () => {
			activeController?.abort(new Error('MCP connection closed'));
			await activeReader?.cancel();
		},
	);
	try {
		const info = await initialize(client, signal, config.timeout ?? 30_000);
		return createConnection(client, info, config.timeout ?? 30_000);
	} catch (error) {
		await client.close();
		throw error;
	}
}

async function readSseResponse(
	body: ReadableStream<Uint8Array>,
	requestId: number | undefined,
	onReader?: (reader: ReadableStreamDefaultReader<Uint8Array>) => void,
): Promise<JsonRpcResponse> {
	const reader = body.getReader();
	onReader?.(reader);
	const decoder = new TextDecoder();
	let buffer = '';
	try {
		for (;;) {
			const chunk = await reader.read();
			buffer += decoder.decode(chunk.value, { stream: !chunk.done });
			const trailingCarriageReturn = !chunk.done && buffer.endsWith('\r');
			const normalized = (trailingCarriageReturn ? buffer.slice(0, -1) : buffer).replace(/\r\n|\r/gu, '\n');
			buffer = normalized + (trailingCarriageReturn ? '\r' : '');
			for (;;) {
				const boundary = buffer.indexOf('\n\n');
				if (boundary < 0) break;
				const event = buffer.slice(0, boundary);
				buffer = buffer.slice(boundary + 2);
				const response = parseSseEvent(event, requestId);
				if (response) {
					await reader.cancel();
					return response;
				}
			}
			if (chunk.done) break;
		}
		const response = parseSseEvent(buffer, requestId);
		if (response) return response;
		throw new Error('MCP SSE response did not contain the requested message');
	} catch (error) {
		await reader.cancel().catch(() => undefined);
		throw error;
	} finally {
		reader.releaseLock();
	}
}

function parseSseEvent(event: string, requestId: number | undefined): JsonRpcResponse | undefined {
	const data = event
		.split('\n')
		.filter((line) => line.startsWith('data:'))
		.map((line) => line.slice(5).replace(/^ /u, ''))
		.join('\n');
	if (!data || data === '[DONE]') return undefined;
	const response = JSON.parse(data) as JsonRpcResponse;
	return requestId === undefined || response.id === requestId ? response : undefined;
}

export function parseHttpResponse(text: string, requestId: number | undefined, contentType = ''): JsonRpcResponse {
	if (!text.trim()) return { jsonrpc: '2.0', id: requestId, result: {} };
	try {
		return JSON.parse(text) as JsonRpcResponse;
	} catch {
		if (!contentType.includes('text/event-stream')) throw new Error('Invalid MCP JSON response');
	}
	const events = text.replace(/\r\n/gu, '\n').split('\n\n');
	for (const event of events) {
		const response = parseSseEvent(event, requestId);
		if (response) return response;
	}
	throw new Error('MCP SSE response did not contain the requested message');
}
