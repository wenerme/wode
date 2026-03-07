import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { DEFAULT_WECHAT_BOT_BASE_URL, fetchWechatBotQrCode, pollWechatBotQrStatus } from './api';
import type { WechatBotCredentials, WechatBotQrCodeResponse, WechatBotQrStatusResponse } from './types';

const DEFAULT_CREDENTIALS_PATH = join(homedir(), '.wode', 'wechat-bot', 'credentials.json');

function resolveCredentialsPath(path?: string): string {
	return path ?? DEFAULT_CREDENTIALS_PATH;
}

function isCredentials(value: unknown): value is WechatBotCredentials {
	if (!value || typeof value !== 'object') return false;
	const v = value as Record<string, unknown>;
	return (
		typeof v.token === 'string' &&
		typeof v.baseUrl === 'string' &&
		typeof v.accountId === 'string' &&
		typeof v.userId === 'string'
	);
}

export interface WechatBotLoginOptions {
	baseUrl?: string;
	credentialsPath?: string;
	force?: boolean;
	qrPollIntervalMs?: number;
	qrStatusTimeoutMs?: number;
	qrExpireResetDelayMs?: number;
	onQrCode?: (data: WechatBotQrCodeResponse) => void | Promise<void>;
	onQrStatus?: (status: WechatBotQrStatusResponse['status']) => void | Promise<void>;
}

export async function loadWechatBotCredentials(credentialsPath?: string): Promise<WechatBotCredentials | undefined> {
	const path = resolveCredentialsPath(credentialsPath);
	try {
		const raw = await readFile(path, 'utf8');
		const parsed = JSON.parse(raw) as unknown;
		if (!isCredentials(parsed)) {
			throw new Error(`Invalid credentials format: ${path}`);
		}
		return parsed;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return undefined;
		}
		throw error;
	}
}

export async function saveWechatBotCredentials(
	credentials: WechatBotCredentials,
	credentialsPath?: string,
): Promise<void> {
	const path = resolveCredentialsPath(credentialsPath);
	await mkdir(dirname(path), { recursive: true, mode: 0o700 });
	await writeFile(path, `${JSON.stringify(credentials, null, 2)}\n`, { mode: 0o600 });
	await chmod(path, 0o600);
}

export async function clearWechatBotCredentials(credentialsPath?: string): Promise<void> {
	await rm(resolveCredentialsPath(credentialsPath), { force: true });
}

export async function loginWechatBot(options: WechatBotLoginOptions = {}): Promise<WechatBotCredentials> {
	const baseUrl = options.baseUrl ?? DEFAULT_WECHAT_BOT_BASE_URL;
	const pollIntervalMs = Math.max(1000, options.qrPollIntervalMs ?? 2000);
	const qrStatusTimeoutMs = Math.max(10000, options.qrStatusTimeoutMs ?? 60000);
	const qrExpireResetDelayMs = Math.max(0, options.qrExpireResetDelayMs ?? 1000);

	if (!options.force) {
		const existing = await loadWechatBotCredentials(options.credentialsPath);
		if (existing) return existing;
	}

	for (;;) {
		const qrCode = await fetchWechatBotQrCode(baseUrl);
		await options.onQrCode?.(qrCode);

		let lastStatus: string | undefined;

		for (;;) {
			let status: WechatBotQrStatusResponse;
			try {
				status = await pollWechatBotQrStatus(baseUrl, qrCode.qrcode, {
					timeoutMs: qrStatusTimeoutMs,
				});
			} catch (error) {
				// Keep polling the same QR code when status API long-poll times out.
				// Timeout is not a terminal login failure.
				if ((error as { name?: string }).name === 'TimeoutError') {
					continue;
				}
				throw error;
			}

			if (status.status !== lastStatus) {
				lastStatus = status.status;
				await options.onQrStatus?.(status.status);
			}

			if (status.status === 'confirmed') {
				if (!status.bot_token || !status.ilink_bot_id || !status.ilink_user_id) {
					throw new Error('QR login confirmed, but API response misses credentials fields');
				}

				const credentials: WechatBotCredentials = {
					token: status.bot_token,
					baseUrl: status.baseurl ?? baseUrl,
					accountId: status.ilink_bot_id,
					userId: status.ilink_user_id,
					savedAt: new Date().toISOString(),
				};
				await saveWechatBotCredentials(credentials, options.credentialsPath);
				return credentials;
			}

			if (status.status === 'expired') {
				if (qrExpireResetDelayMs > 0) {
					await sleep(qrExpireResetDelayMs);
				}
				break;
			}

			await sleep(pollIntervalMs);
		}
	}
}

export { DEFAULT_CREDENTIALS_PATH as DEFAULT_WECHAT_BOT_CREDENTIALS_PATH };
