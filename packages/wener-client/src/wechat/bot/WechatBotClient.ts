import { setTimeout as sleep } from 'node:timers/promises';
import {
	buildWechatBotTextMessage,
	createWechatBotBaseInfo,
	DEFAULT_WECHAT_BOT_BASE_URL,
	getWechatBotConfig,
	getWechatBotUpdates,
	sendWechatBotMessage,
	sendWechatBotTyping,
	type WechatBotRequestOptions,
} from './api';
import {
	clearWechatBotCredentials,
	loadWechatBotCredentials,
	loginWechatBot,
	type WechatBotLoginOptions,
} from './auth';
import { isWechatBotSessionExpiredError } from './errors';
import {
	WechatBotMessageType,
	type WechatBotCredentials,
	type WechatBotIncomingMessage,
	type WechatBotMessage,
} from './types';
import { chunkWechatBotText, detectWechatBotMessageType, extractWechatBotText } from './utils';

type MessageHandler = (message: WechatBotIncomingMessage) => void | Promise<void>;

export interface WechatBotClientOptions {
	baseUrl?: string;
	credentialsPath?: string;
	autoReLogin?: boolean;
	maxBackoffMs?: number;
	sendChunkLimit?: number;
	onError?: (error: unknown) => void | Promise<void>;
	onStatus?: (status: string) => void | Promise<void>;
}

export interface WechatBotSendOptions {
	contextToken?: string;
	request?: WechatBotRequestOptions;
}

export class WechatBotClient {
	private readonly handlers: MessageHandler[] = [];
	private readonly contextTokenMap = new Map<string, string>();
	private credentials?: WechatBotCredentials;
	private cursor = '';
	private running = false;
	private pollAbortController: AbortController | null = null;
	private loopPromise: Promise<void> | null = null;
	private readonly options: Required<
		Pick<WechatBotClientOptions, 'autoReLogin' | 'maxBackoffMs' | 'sendChunkLimit'>
	> &
		Omit<WechatBotClientOptions, 'autoReLogin' | 'maxBackoffMs' | 'sendChunkLimit'>;

	constructor(options: WechatBotClientOptions = {}) {
		this.options = {
			baseUrl: options.baseUrl ?? DEFAULT_WECHAT_BOT_BASE_URL,
			credentialsPath: options.credentialsPath,
			autoReLogin: options.autoReLogin ?? true,
			maxBackoffMs: options.maxBackoffMs ?? 10000,
			sendChunkLimit: options.sendChunkLimit ?? 2000,
			onError: options.onError,
			onStatus: options.onStatus,
		};
	}

	get isRunning(): boolean {
		return this.running;
	}

	onMessage(handler: MessageHandler): this {
		this.handlers.push(handler);
		return this;
	}

	async login(options: WechatBotLoginOptions = {}): Promise<WechatBotCredentials> {
		const credentials = await loginWechatBot({
			baseUrl: this.options.baseUrl,
			credentialsPath: this.options.credentialsPath,
			...options,
		});
		this.setCredentials(credentials);
		return credentials;
	}

	async loadCredentials(): Promise<WechatBotCredentials | undefined> {
		const credentials = await loadWechatBotCredentials(this.options.credentialsPath);
		if (credentials) {
			this.setCredentials(credentials);
		}
		return credentials;
	}

	async run(): Promise<void> {
		await this.start();
	}

	async start(): Promise<void> {
		if (this.loopPromise) {
			return this.loopPromise;
		}
		this.running = true;
		this.loopPromise = this.pollLoop();
		try {
			await this.loopPromise;
		} finally {
			this.loopPromise = null;
			this.pollAbortController = null;
		}
	}

	stop(): void {
		this.running = false;
		this.pollAbortController?.abort();
	}

	async waitUntilStopped(): Promise<void> {
		if (this.loopPromise) {
			await this.loopPromise;
		}
	}

	async reply(message: WechatBotIncomingMessage, text: string, options: WechatBotSendOptions = {}): Promise<void> {
		await this.send(message.userId, text, {
			...options,
			contextToken: options.contextToken ?? message.contextToken,
		});
		this.stopTyping(message.userId).catch(() => {});
	}

	async send(userId: string, text: string, options: WechatBotSendOptions = {}): Promise<void> {
		const credentials = await this.ensureCredentials();
		const contextToken = options.contextToken ?? this.contextTokenMap.get(userId);
		if (!contextToken) {
			throw new Error(`No context token for user ${userId}. Reply after receiving a message from this user.`);
		}

		const chunks = chunkWechatBotText(text, this.options.sendChunkLimit);
		for (const chunk of chunks) {
			const payload = buildWechatBotTextMessage(userId, contextToken, chunk);
			await sendWechatBotMessage(credentials.baseUrl, credentials.token, payload, options.request);
		}
	}

	async sendTyping(userId: string, options: WechatBotSendOptions = {}): Promise<void> {
		await this.sendTypingInternal(userId, 1, options);
	}

	async stopTyping(userId: string, options: WechatBotSendOptions = {}): Promise<void> {
		await this.sendTypingInternal(userId, 2, options);
	}

	private async sendTypingInternal(
		userId: string,
		status: 1 | 2,
		options: WechatBotSendOptions = {},
	): Promise<void> {
		const credentials = await this.ensureCredentials();
		const contextToken = options.contextToken ?? this.contextTokenMap.get(userId);
		if (!contextToken) {
			throw new Error(`No context token for user ${userId}.`);
		}

		const config = await getWechatBotConfig(
			credentials.baseUrl,
			credentials.token,
			userId,
			contextToken,
			options.request,
		);
		if (!config.typing_ticket) {
			return;
		}
		await sendWechatBotTyping(
			credentials.baseUrl,
			credentials.token,
			{
				ilink_user_id: userId,
				typing_ticket: config.typing_ticket,
				status,
				base_info: createWechatBotBaseInfo(),
			},
			options.request,
		);
	}

	private setCredentials(credentials: WechatBotCredentials): void {
		this.credentials = credentials;
		this.options.baseUrl = credentials.baseUrl;
	}

	private async ensureCredentials(): Promise<WechatBotCredentials> {
		if (this.credentials) {
			return this.credentials;
		}
		const stored = await loadWechatBotCredentials(this.options.credentialsPath);
		if (stored) {
			this.setCredentials(stored);
			return stored;
		}
		return this.login();
	}

	private async pollLoop(): Promise<void> {
		await this.ensureCredentials();
		await this.reportStatus('polling:started');

		let retryDelayMs = 1000;
		while (this.running) {
			try {
				const credentials = await this.ensureCredentials();
				this.pollAbortController = new AbortController();
				const response = await getWechatBotUpdates(credentials.baseUrl, credentials.token, this.cursor, {
					timeoutMs: 40000,
					signal: this.pollAbortController.signal,
				});
				this.pollAbortController = null;
				this.cursor = response.get_updates_buf || this.cursor;
				retryDelayMs = 1000;

				for (const raw of response.msgs ?? []) {
					this.rememberContextToken(raw);
					const incoming = this.toIncomingMessage(raw);
					if (!incoming) continue;
					await this.dispatch(incoming);
				}
			} catch (error) {
				this.pollAbortController = null;
				if (!this.running && (error as { name?: string }).name === 'AbortError') {
					break;
				}

				if (isWechatBotSessionExpiredError(error) && this.options.autoReLogin) {
					await this.reportStatus('session:expired');
					this.credentials = undefined;
					this.cursor = '';
					this.contextTokenMap.clear();
					try {
						await clearWechatBotCredentials(this.options.credentialsPath);
						await this.login({ force: true } as WechatBotLoginOptions);
						retryDelayMs = 1000;
						continue;
					} catch (reloginError) {
						await this.reportError(reloginError);
					}
				} else {
					await this.reportError(error);
				}

				await sleep(retryDelayMs);
				retryDelayMs = Math.min(retryDelayMs * 2, this.options.maxBackoffMs);
			}
		}

		await this.reportStatus('polling:stopped');
	}

	private rememberContextToken(message: WechatBotMessage): void {
		const userId =
			message.message_type === WechatBotMessageType.User
				? message.from_user_id
				: message.to_user_id;
		if (userId && message.context_token) {
			this.contextTokenMap.set(userId, message.context_token);
		}
	}

	private toIncomingMessage(message: WechatBotMessage): WechatBotIncomingMessage | null {
		if (message.message_type !== WechatBotMessageType.User) {
			return null;
		}
		return {
			id: String(message.message_id),
			messageId: message.message_id,
			userId: message.from_user_id,
			text: extractWechatBotText(message.item_list),
			type: detectWechatBotMessageType(message.item_list),
			contextToken: message.context_token,
			timestamp: new Date(message.create_time_ms),
			raw: message,
		};
	}

	private async dispatch(message: WechatBotIncomingMessage): Promise<void> {
		if (this.handlers.length === 0) return;
		const results = await Promise.allSettled(this.handlers.map(async (handler) => handler(message)));
		for (const result of results) {
			if (result.status === 'rejected') {
				await this.reportError(result.reason);
			}
		}
	}

	private async reportError(error: unknown): Promise<void> {
		if (!this.options.onError) return;
		await this.options.onError(error);
	}

	private async reportStatus(status: string): Promise<void> {
		if (!this.options.onStatus) return;
		await this.options.onStatus(status);
	}
}
