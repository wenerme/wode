import { defineServiceCapability } from '../registry/ServiceCapability';
import type { IFeishuServiceContract, FeishuServiceInputs } from './FeishuServiceContract';

export type FeishuSendMessageInput = FeishuServiceInputs['sendMessage'];
export type FeishuSendWebhookInput = FeishuServiceInputs['sendWebhook'];
export type FeishuRequestInput = FeishuServiceInputs['request'];

export interface IFeishuService extends AsyncDisposable, IFeishuServiceContract {
	readonly type: 'feishu';
	readonly readOnly: boolean;
	close(): Promise<void>;
}
export type FeishuService = IFeishuService;

/** Capability key for `IFeishuService`; `registry.load(FeishuServiceCapability)` resolves to `IFeishuService`. */
export const FeishuServiceCapability = defineServiceCapability<IFeishuService>('feishu');
