import { defineServiceCapability } from '../registry/ServiceCapability';

export interface LarkSendMessageInput {
	to: string;
	text: string;
}
export interface LarkSendWebhookInput {
	text?: string;
	markdown?: string;
}
export interface LarkRequestInput {
	path: string;
	method?: string;
	body?: unknown;
	params?: Record<string, string>;
}

export interface ILarkService extends AsyncDisposable {
	readonly type: 'lark';
	readonly readOnly: boolean;
	sendMessage(input: LarkSendMessageInput): Promise<unknown>;
	sendWebhook(input: LarkSendWebhookInput): Promise<unknown>;
	request(input: LarkRequestInput): Promise<unknown>;
	close(): Promise<void>;
}
export type LarkService = ILarkService;

/** Capability key for `ILarkService`; `registry.load(LarkServiceCapability)` resolves to `ILarkService`. */
export const LarkServiceCapability = defineServiceCapability<ILarkService>('lark');
