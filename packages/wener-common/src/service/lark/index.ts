import { FeishuClient, sendWebhook } from '@wener/client/feishu/server';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import { LarkServiceOptionsSchema } from './config';
import { LarkServiceError, LarkServiceErrorCodes } from './errors';
import type { ILarkService, LarkRequestInput, LarkSendMessageInput, LarkSendWebhookInput } from './ILarkService';
import { LarkOperations } from './operations';
import { LarkServiceCapability } from './ILarkService';

export * from './config';
export * from './errors';
export * from './ILarkService';
export * from './operations';
export { sanitizeLarkOutput } from './sanitize';

function resolveCredential(
	getEnv: ((name: string) => string | undefined) | undefined,
	name: string | undefined,
): string | undefined {
	if (name === undefined) return undefined;
	const value = getEnv?.(name);
	return value === undefined || value === '' ? undefined : value;
}

export const LarkServiceProvider: ServiceProviderDefinition<ILarkService> = {
	name: 'lark',
	title: 'Lark/Feishu',
	description: 'Send Lark/Feishu messages via app credential or group webhook, and call the Feishu OpenAPI.',
	aliases: ['feishu'],
	provides: [LarkServiceCapability],
	optionsSchema: LarkServiceOptionsSchema,
	operations: LarkOperations,
	create(context: ServiceProviderContext) {
		const parsed = LarkServiceOptionsSchema.safeParse(context.config.options ?? {});
		if (!parsed.success) throw new LarkServiceError(LarkServiceErrorCodes.InvalidConfig, 'Lark service configuration is invalid');
		const options = parsed.data;
		const getEnv = context.getEnv;

		const appId = resolveCredential(getEnv, options.appIdEnv);
		const appSecret = resolveCredential(getEnv, options.appSecretEnv);
		const webhookUrl = resolveCredential(getEnv, options.webhookUrlEnv);
		const webhookSecret = resolveCredential(getEnv, options.webhookSecretEnv);

		const appClient = appId !== undefined && appSecret !== undefined
			? new FeishuClient({ appId, appSecret, fetch: context.fetch })
			: undefined;

		const readOnly = context.config.readOnly !== false;
		const assertWritable = () => {
			if (readOnly) throw new LarkServiceError(LarkServiceErrorCodes.ReadOnly, 'Lark service is read-only');
		};

		const service: ILarkService = {
			type: 'lark',
			readOnly,
			async sendMessage(input: LarkSendMessageInput) {
				if (!appClient) {
					throw new LarkServiceError(
						LarkServiceErrorCodes.MissingAppCredential,
						'Lark sendMessage requires appIdEnv and appSecretEnv',
					);
				}
				assertWritable();
				return appClient.sendMessage({
					body: {
						receive_id: input.to,
						msg_type: 'text',
						content: input.text,
					},
				});
			},
			async sendWebhook(input: LarkSendWebhookInput) {
				if (webhookUrl === undefined) {
					throw new LarkServiceError(
						LarkServiceErrorCodes.MissingWebhookConfig,
						'Lark sendWebhook requires webhookUrlEnv',
					);
				}
				assertWritable();
				return sendWebhook({
					url: webhookUrl,
					secret: webhookSecret,
					text: input.text,
					markdown: input.markdown,
					fetch: context.fetch,
				});
			},
			async request(input: LarkRequestInput) {
				if (!appClient) {
					throw new LarkServiceError(
						LarkServiceErrorCodes.MissingAppCredential,
						'Lark request requires appIdEnv and appSecretEnv',
					);
				}
				assertWritable();
				return appClient.request({
					url: input.path,
					method: input.method as any,
					body: input.body,
					params: input.params,
				});
			},
			async close() {
				// FeishuClient / sendWebhook have no open connection or timer to release.
				return Promise.resolve();
			},
			[Symbol.asyncDispose]() {
				return this.close();
			},
		};
		return { lark: service };
	},
};
