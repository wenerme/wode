import { setTimeout as sleep } from 'node:timers/promises';
import { WecomBotClientError } from './errors';
import type {
	WecomBotCommandRequest,
	WecomBotIncomingCallbackPacket,
	WecomBotOutgoingMessageBody,
	WecomBotResponsePacket,
	WecomBotSendMessageBody,
} from './types';
import {
	generateWecomReqId,
	isWecomBotCallbackPacket,
	isWecomBotResponsePacket,
	parseWecomPacket,
	toWecomSendChatType,
} from './utils';

export const DEFAULT_WECOM_BOT_WS_URL = 'wss://openws.work.weixin.qq.com';

type CallbackHandler = (packet: WecomBotIncomingCallbackPacket) => void | Promise<void>;
type StatusHandler = (status: string) => void | Promise<void>;
type ErrorHandler = (error: unknown) => void | Promise<void>;

interface PendingRequest {
	cmd: string;
	reqId: string;
	resolve: (packet: WecomBotResponsePacket) => void;
	reject: (error: unknown) => void;
	timer: ReturnType<typeof setTimeout>;
}

interface WecomSocketLike {
	readyState: number;
	send(data: string): void;
	close(code?: number, reason?: string): void;
	addEventListener?: (type: string, listener: (...args: unknown[]) => void) => void;
	removeEventListener?: (type: string, listener: (...args: unknown[]) => void) => void;
	on?: (type: string, listener: (...args: unknown[]) => void) => void;
	off?: (type: string, listener: (...args: unknown[]) => void) => void;
	removeListener?: (type: string, listener: (...args: unknown[]) => void) => void;
}

export interface WecomBotClientOptions {
	botId: string;
	secret: string;
	wsUrl?: string;
	autoReconnect?: boolean;
	heartbeatIntervalMs?: number;
	requestTimeoutMs?: number;
	reconnectInitialDelayMs?: number;
	reconnectMaxDelayMs?: number;
	onStatus?: StatusHandler;
	onError?: ErrorHandler;
	createWebSocket?: (url: string) => WecomSocketLike | Promise<WecomSocketLike>;
}

function hasAddEventListener(socket: WecomSocketLike): socket is WecomSocketLike & {
	addEventListener: (type: string, listener: (...args: unknown[]) => void) => void;
	removeEventListener: (type: string, listener: (...args: unknown[]) => void) => void;
} {
	return typeof socket.addEventListener === 'function' && typeof socket.removeEventListener === 'function';
}

function hasEmitterApi(socket: WecomSocketLike): socket is WecomSocketLike & {
	on: (type: string, listener: (...args: unknown[]) => void) => void;
} {
	return typeof socket.on === 'function';
}

function addSocketListener(socket: WecomSocketLike, type: string, handler: (...args: unknown[]) => void): () => void {
	if (hasAddEventListener(socket)) {
		socket.addEventListener(type, handler);
		return () => socket.removeEventListener(type, handler);
	}
	if (hasEmitterApi(socket)) {
		socket.on(type, handler);
		return () => {
			if (typeof socket.off === 'function') {
				socket.off(type, handler);
				return;
			}
			if (typeof socket.removeListener === 'function') {
				socket.removeListener(type, handler);
			}
		};
	}
	throw new Error('Unsupported WebSocket implementation');
}

function getReadyState(socket: WecomSocketLike): number {
	return Number(socket.readyState ?? -1);
}

function toTextPayload(data: unknown): string {
	if (typeof data === 'string') return data;

	if (data && typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
		return data.toString('utf8');
	}

	if (data instanceof ArrayBuffer) {
		return Buffer.from(data).toString('utf8');
	}

	if (ArrayBuffer.isView(data)) {
		return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8');
	}

	const maybeEventData = (data as { data?: unknown } | undefined)?.data;
	if (typeof maybeEventData === 'string') return maybeEventData;
	if (maybeEventData && typeof Buffer !== 'undefined' && Buffer.isBuffer(maybeEventData)) {
		return maybeEventData.toString('utf8');
	}
	if (maybeEventData instanceof ArrayBuffer) {
		return Buffer.from(maybeEventData).toString('utf8');
	}
	if (ArrayBuffer.isView(maybeEventData)) {
		return Buffer.from(maybeEventData.buffer, maybeEventData.byteOffset, maybeEventData.byteLength).toString('utf8');
	}

	throw new Error(`Unsupported WebSocket data type: ${typeof data}`);
}

export class WecomBotClient {
	private readonly handlers: CallbackHandler[] = [];
	private readonly options: Required<
		Pick<
			WecomBotClientOptions,
			| 'wsUrl'
			| 'autoReconnect'
			| 'heartbeatIntervalMs'
			| 'requestTimeoutMs'
			| 'reconnectInitialDelayMs'
			| 'reconnectMaxDelayMs'
		>
	> &
		Omit<
			WecomBotClientOptions,
			| 'wsUrl'
			| 'autoReconnect'
			| 'heartbeatIntervalMs'
			| 'requestTimeoutMs'
			| 'reconnectInitialDelayMs'
			| 'reconnectMaxDelayMs'
		>;
	private ws: WecomSocketLike | null = null;
	private cleanupSocketListeners: Array<() => void> = [];
	private pending = new Map<string, PendingRequest>();
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private connectPromise: Promise<void> | null = null;
	private running = false;
	private reconnectAttempt = 0;

	constructor(options: WecomBotClientOptions) {
		this.options = {
			...options,
			wsUrl: options.wsUrl ?? DEFAULT_WECOM_BOT_WS_URL,
			autoReconnect: options.autoReconnect ?? true,
			heartbeatIntervalMs: options.heartbeatIntervalMs ?? 30_000,
			requestTimeoutMs: options.requestTimeoutMs ?? 15_000,
			reconnectInitialDelayMs: options.reconnectInitialDelayMs ?? 1_000,
			reconnectMaxDelayMs: options.reconnectMaxDelayMs ?? 30_000,
		};
	}

	get isRunning(): boolean {
		return this.running;
	}

	onCallback(handler: CallbackHandler): this {
		this.handlers.push(handler);
		return this;
	}

	async start(): Promise<void> {
		this.running = true;
		await this.ensureConnected();
	}

	async stop(): Promise<void> {
		this.running = false;
		this.clearReconnectTimer();
		this.clearHeartbeatTimer();
		this.rejectPending(new WecomBotClientError('Client stopped'));

		const ws = this.ws;
		this.ws = null;
		this.detachSocketListeners();
		if (ws) {
			try {
				ws.close(1000, 'client stop');
			} catch {}
		}

		if (this.connectPromise) {
			await this.connectPromise.catch(() => {});
			this.connectPromise = null;
		}
	}

	async waitUntilConnected(): Promise<void> {
		await this.ensureConnected();
	}

	async ping(reqId?: string): Promise<WecomBotResponsePacket> {
		return this.sendCommand({ cmd: 'ping' }, { reqId });
	}

	async subscribe(reqId?: string): Promise<WecomBotResponsePacket> {
		return this.sendCommand(
			{
				cmd: 'aibot_subscribe',
				body: {
					bot_id: this.options.botId,
					secret: this.options.secret,
				},
			},
			{ reqId },
		);
	}

	async respondWelcome(reqId: string, body: WecomBotOutgoingMessageBody): Promise<WecomBotResponsePacket> {
		return this.sendCommand(
			{
				cmd: 'aibot_respond_welcome_msg',
				body,
			},
			{ reqId },
		);
	}

	async respondMessage(reqId: string, body: WecomBotOutgoingMessageBody): Promise<WecomBotResponsePacket> {
		return this.sendCommand(
			{
				cmd: 'aibot_respond_msg',
				body,
			},
			{ reqId },
		);
	}

	async respondUpdateMessage(reqId: string, body: Record<string, unknown>): Promise<WecomBotResponsePacket> {
		return this.sendCommand(
			{
				cmd: 'aibot_respond_update_msg',
				body,
			},
			{ reqId },
		);
	}

	async sendMessage(body: WecomBotSendMessageBody, reqId?: string): Promise<WecomBotResponsePacket> {
		return this.sendCommand(
			{
				cmd: 'aibot_send_msg',
				body,
			},
			{ reqId },
		);
	}

	async sendMarkdown(
		chatId: string,
		content: string,
		options: { chatType?: 'single' | 'group' | 0 | 1 | 2; reqId?: string } = {},
	): Promise<WecomBotResponsePacket> {
		return this.sendMessage(
			{
				chatid: chatId,
				chat_type: toWecomSendChatType(options.chatType),
				msgtype: 'markdown',
				markdown: { content },
			},
			options.reqId,
		);
	}

	private async ensureConnected(): Promise<void> {
		if (this.isSocketOpen()) return;
		if (!this.connectPromise) {
			this.connectPromise = this.connectAndSubscribe().finally(() => {
				this.connectPromise = null;
			});
		}
		await this.connectPromise;
	}

	private isSocketOpen(): boolean {
		const ws = this.ws;
		return !!ws && getReadyState(ws) === 1;
	}

	private async connectAndSubscribe(): Promise<void> {
		const ws = await this.createSocket(this.options.wsUrl);
		this.ws = ws;
		this.attachSocketListeners(ws);

		try {
			await this.waitSocketOpen(ws);
			this.reconnectAttempt = 0;
			await this.reportStatus('wecom:connected');
			await this.subscribe();
			await this.reportStatus('wecom:subscribed');
			this.startHeartbeat();
		} catch (error) {
			this.clearHeartbeatTimer();
			this.detachSocketListeners();
			if (this.ws === ws) this.ws = null;
			try {
				ws.close();
			} catch {}
			throw error;
		}
	}

	private async createSocket(url: string): Promise<WecomSocketLike> {
		if (this.options.createWebSocket) {
			return this.options.createWebSocket(url);
		}

		const globalCtor = (globalThis as { WebSocket?: new (url: string) => WecomSocketLike }).WebSocket;
		if (typeof globalCtor === 'function') {
			return new globalCtor(url);
		}

		try {
			const mod = (await import('ws')) as { WebSocket?: new (url: string) => WecomSocketLike; default?: any };
			const WsCtor = mod.WebSocket ?? mod.default;
			if (typeof WsCtor === 'function') {
				return new WsCtor(url);
			}
		} catch {}

		throw new WecomBotClientError('WebSocket is unavailable. Provide options.createWebSocket or run in Bun/Node>=22.');
	}

	private waitSocketOpen(socket: WecomSocketLike): Promise<void> {
		if (getReadyState(socket) === 1) {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				cleanup();
				reject(new WecomBotClientError('WebSocket open timeout'));
			}, this.options.requestTimeoutMs);

			const cleanupFns: Array<() => void> = [];
			const cleanup = () => {
				clearTimeout(timeout);
				for (const fn of cleanupFns) fn();
			};

			cleanupFns.push(
				addSocketListener(socket, 'open', () => {
					cleanup();
					resolve();
				}),
			);
			cleanupFns.push(
				addSocketListener(socket, 'error', (event) => {
					cleanup();
					reject(
						new WecomBotClientError('WebSocket open error', {
							payload: event,
						}),
					);
				}),
			);
			cleanupFns.push(
				addSocketListener(socket, 'close', (event) => {
					cleanup();
					reject(
						new WecomBotClientError('WebSocket closed before open', {
							payload: event,
						}),
					);
				}),
			);
		});
	}

	private attachSocketListeners(socket: WecomSocketLike): void {
		this.detachSocketListeners();
		this.cleanupSocketListeners.push(
			addSocketListener(socket, 'message', async (event) => {
				await this.handleSocketMessage(event);
			}),
		);
		this.cleanupSocketListeners.push(
			addSocketListener(socket, 'error', async (event) => {
				await this.reportError(new WecomBotClientError('WebSocket error', { payload: event }));
			}),
		);
		this.cleanupSocketListeners.push(
			addSocketListener(socket, 'close', async (event) => {
				await this.handleSocketClose(event);
			}),
		);
	}

	private detachSocketListeners(): void {
		for (const cleanup of this.cleanupSocketListeners) cleanup();
		this.cleanupSocketListeners = [];
	}

	private clearHeartbeatTimer(): void {
		if (!this.heartbeatTimer) return;
		clearInterval(this.heartbeatTimer);
		this.heartbeatTimer = null;
	}

	private startHeartbeat(): void {
		this.clearHeartbeatTimer();
		this.heartbeatTimer = setInterval(() => {
			this.ping().catch((error) => {
				void this.reportError(error);
			});
		}, this.options.heartbeatIntervalMs);
	}

	private clearReconnectTimer(): void {
		if (!this.reconnectTimer) return;
		clearTimeout(this.reconnectTimer);
		this.reconnectTimer = null;
	}

	private scheduleReconnect(): void {
		if (!this.running || !this.options.autoReconnect) return;
		if (this.reconnectTimer) return;

		const base = this.options.reconnectInitialDelayMs;
		const max = this.options.reconnectMaxDelayMs;
		const delay = Math.min(base * 2 ** this.reconnectAttempt, max);
		this.reconnectAttempt += 1;

		this.reconnectTimer = setTimeout(async () => {
			this.reconnectTimer = null;
			if (!this.running) return;
			try {
				await this.ensureConnected();
			} catch (error) {
				await this.reportError(error);
				this.scheduleReconnect();
			}
		}, delay);
	}

	private rejectPending(error: unknown): void {
		for (const pending of this.pending.values()) {
			clearTimeout(pending.timer);
			pending.reject(error);
		}
		this.pending.clear();
	}

	private async handleSocketClose(event: unknown): Promise<void> {
		this.clearHeartbeatTimer();
		this.rejectPending(new WecomBotClientError('WebSocket closed', { payload: event }));
		this.detachSocketListeners();
		this.ws = null;
		await this.reportStatus('wecom:disconnected');
		this.scheduleReconnect();
	}

	private async handleSocketMessage(event: unknown): Promise<void> {
		let text: string;
		try {
			text = toTextPayload(event);
		} catch (error) {
			await this.reportError(error);
			return;
		}

		let packet: unknown;
		try {
			packet = parseWecomPacket(text);
		} catch (error) {
			await this.reportError(
				new WecomBotClientError('Failed to parse WeCom packet', {
					payload: { text, error },
				}),
			);
			return;
		}

		if (isWecomBotCallbackPacket(packet)) {
			for (const handler of this.handlers) {
				try {
					await handler(packet);
				} catch (error) {
					await this.reportError(error);
				}
			}
			return;
		}

		if (isWecomBotResponsePacket(packet)) {
			const reqId = packet.headers.req_id;
			const pending = this.pending.get(reqId);
			if (!pending) return;
			this.pending.delete(reqId);
			clearTimeout(pending.timer);
			if (packet.errcode !== 0) {
				pending.reject(
					new WecomBotClientError(packet.errmsg || `${pending.cmd} failed`, {
						cmd: pending.cmd,
						reqId,
						errcode: packet.errcode,
						payload: packet,
					}),
				);
				return;
			}
			pending.resolve(packet);
			return;
		}
	}

	private async sendCommand(
		request: WecomBotCommandRequest,
		options: { reqId?: string; timeoutMs?: number } = {},
	): Promise<WecomBotResponsePacket> {
		await this.ensureConnected();
		const ws = this.ws;
		if (!ws || getReadyState(ws) !== 1) {
			throw new WecomBotClientError('WebSocket is not connected', { cmd: request.cmd });
		}

		const reqId = options.reqId || generateWecomReqId();
		const payload = {
			cmd: request.cmd,
			headers: { req_id: reqId },
			...(request.body ? { body: request.body } : {}),
		};

		const timeoutMs = options.timeoutMs ?? this.options.requestTimeoutMs;
		const pending = new Promise<WecomBotResponsePacket>((resolve, reject) => {
			const timer = setTimeout(() => {
				this.pending.delete(reqId);
				reject(
					new WecomBotClientError(`${request.cmd} timed out`, {
						cmd: request.cmd,
						reqId,
					}),
				);
			}, timeoutMs);
			this.pending.set(reqId, {
				cmd: request.cmd,
				reqId,
				resolve,
				reject,
				timer,
			});
		});

		try {
			ws.send(JSON.stringify(payload));
		} catch (error) {
			const p = this.pending.get(reqId);
			if (p) {
				clearTimeout(p.timer);
				this.pending.delete(reqId);
			}
			throw new WecomBotClientError(`Failed to send ${request.cmd}`, {
				cmd: request.cmd,
				reqId,
				payload: error,
			});
		}

		return pending;
	}

	private async reportStatus(status: string): Promise<void> {
		if (!this.options.onStatus) return;
		await this.options.onStatus(status);
	}

	private async reportError(error: unknown): Promise<void> {
		if (this.options.onError) {
			await this.options.onError(error);
		}
	}
}

export async function connectWecomBot(options: WecomBotClientOptions): Promise<WecomBotClient> {
	const client = new WecomBotClient(options);
	await client.start();
	return client;
}

export async function waitForWecomBotReconnect(client: WecomBotClient, timeoutMs = 30_000): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		if (client.isRunning) {
			try {
				await client.waitUntilConnected();
				return true;
			} catch {}
		}
		await sleep(200);
	}
	return false;
}
