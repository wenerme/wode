import { defineServiceCapability } from '../registry/ServiceCapability';
import { TELEGRAM_READ_ONLY_METHODS } from '@wener/client/telegram';
import type { ITelegramServiceContract } from './TelegramServiceContract';

export type {
	TelegramRequestInput, TelegramSendMessageInput,
} from './TelegramServiceContract';

/**
 * Bot API methods that only read state. Anything not in this list is treated as a write and
 * requires an explicit confirmation (CLI `--yes`) plus a writable (non read-only) service.
 */
export const TelegramReadOnlyMethods = TELEGRAM_READ_ONLY_METHODS;

export function isTelegramWriteMethod(method: string): boolean {
	return !TelegramReadOnlyMethods.has(method);
}

export interface ITelegramService extends AsyncDisposable, ITelegramServiceContract {
	readonly type: 'telegram';
	readonly readOnly: boolean;
	close(): Promise<void>;
}
export type TelegramService = ITelegramService;

/** Capability key for `ITelegramService`; registry loading preserves the contract-derived interface. */
export const TelegramServiceCapability = defineServiceCapability<ITelegramService>('telegram');
