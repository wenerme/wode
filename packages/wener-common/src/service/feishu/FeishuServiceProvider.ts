import { FeishuOpenApiClient, type FeishuSendMessageParams, sendWebhook } from '@wener/client/feishu/server';
import type { FetchLike } from '@wener/utils';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import { FeishuServiceOptionsSchema } from './config';
import { FeishuServiceError, FeishuServiceErrorCodes } from './errors';
import type { IFeishuService } from './IFeishuService';
import { FeishuOperations } from './operations';
import { FeishuServiceCapability } from './IFeishuService';
import {
	FeishuRequestInputSchema, FeishuSendMessageInputSchema, FeishuSendMessageOutputSchema,
	FeishuSendWebhookInputSchema, FeishuSendWebhookOutputSchema,
	type FeishuServiceCallOptions,
} from './FeishuServiceContract';
import { feishuCall, feishuOutput, feishuTimeout } from './call';
import * as schema from './schema';
import * as apiSchema from './api.schema';
import { describeFeishuApi, executeFeishuApiCall, listFeishuApi, prepareFeishuApiCall } from './api';

function resolveCredential(
	getEnv: ((name: string) => string | undefined) | undefined,
	name: string | undefined,
): string | undefined {
	if (name === undefined) return undefined;
	const value = getEnv?.(name);
	return value === undefined || value === '' ? undefined : value;
}

/** Infer `receive_id_type` from the id prefix: `ou_` open_id, `on_` union_id, `oc_` chat_id, `@` email. */
function receiveIdTypeOf(to: string): FeishuSendMessageParams['receiveIdType'] {
	if (to.startsWith('ou_')) return 'open_id';
	if (to.startsWith('on_')) return 'union_id';
	if (to.startsWith('oc_')) return 'chat_id';
	if (to.includes('@')) return 'email';
	throw new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, 'Unknown Feishu receive id type; use an ou_, on_, oc_ id or an email');
}

export const FeishuServiceProvider = {
	name: 'feishu',
	title: 'Feishu',
	description: 'Send Feishu/Lark messages via app credential or group webhook, and call the Feishu OpenAPI.',
	provides: [FeishuServiceCapability],
	optionsSchema: FeishuServiceOptionsSchema,
	operations: FeishuOperations,
	create(context: ServiceProviderContext) {
		const parsed = FeishuServiceOptionsSchema.safeParse(context.config.options ?? {});
		if (!parsed.success) throw new FeishuServiceError(FeishuServiceErrorCodes.InvalidConfig, 'Feishu service configuration is invalid');
		const options = parsed.data;
		const getEnv = context.getEnv;

		// Credentials are resolved on first use, so catalog lookups and dry runs never read them.
		// One client owns the only in-memory tenant token for every app-credential operation; the
		// exchange shares the operation's injected fetch and effective signal, so the deadline can abort it.
		let openApiClient: FeishuOpenApiClient | null | undefined;
		const getOpenApi = (): FeishuOpenApiClient => {
			if (openApiClient === undefined) {
				const appId = resolveCredential(getEnv, options.appIdEnv);
				const appSecret = resolveCredential(getEnv, options.appSecretEnv);
				openApiClient = appId !== undefined && appSecret !== undefined
					? new FeishuOpenApiClient({ appId, appSecret, fetch: context.fetch as FetchLike })
					: null;
			}
			if (!openApiClient) throw new FeishuServiceError(
				FeishuServiceErrorCodes.MissingAppCredential, 'Feishu operation requires appIdEnv and appSecretEnv',
			);
			return openApiClient;
		};

		const readOnly = context.config.readOnly !== false;
		const controller = new AbortController();
		let closed = false;
		let closePromise: Promise<void> | undefined;
		const assertWritable = () => {
			if (closed) throw new FeishuServiceError(FeishuServiceErrorCodes.Closed, 'Feishu service is closed');
			if (readOnly) throw new FeishuServiceError(FeishuServiceErrorCodes.ReadOnly, 'Feishu service is read-only');
		};
		const assertOpen = () => {
			if (closed) throw new FeishuServiceError(FeishuServiceErrorCodes.Closed, 'Feishu service is closed');
		};
		const signalFor = (options?: FeishuServiceCallOptions) => options?.signal
			? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
		/** One operation boundary: gate, parse input, then token exchange + API under one deadline. */
		const openApiCall = async <I, T>(
			mode: 'read' | 'write',
			inputSchema: { parse(value: unknown): I },
			input: unknown,
			callOptions: FeishuServiceCallOptions | undefined,
			run: (client: FeishuOpenApiClient, input: I, signal: AbortSignal) => Promise<T>,
		): Promise<T> => {
			if (mode === 'write') assertWritable();
			else assertOpen();
			const openApi = getOpenApi();
			let parsed: I;
			try {
				parsed = inputSchema.parse(input);
			} catch {
				throw new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, 'Invalid Feishu service input');
			}
			const signal = signalFor(callOptions);
			const timeout = feishuTimeout(callOptions) ?? options.timeoutMs;
			return feishuCall(signal, (effectiveSignal) => run(openApi, parsed, effectiveSignal), timeout);
		};

		const parseInput = <I>(inputSchema: { parse(value: unknown): I }, input: unknown): I => {
			try {
				return inputSchema.parse(input);
			} catch {
				throw new FeishuServiceError(FeishuServiceErrorCodes.InvalidInput, 'Invalid Feishu service input');
			}
		};
		/**
		 * Generic catalog call: gate (closed; writable unless dry run), then risk, availability and
		 * schema validation, all before credentials. Only then token exchange + API under one deadline.
		 */
		const genericCall = async (
			mode: 'read' | 'write',
			inputSchema: { parse(value: unknown): { id: string; dryRun?: boolean; confirmHighRisk?: boolean } & Record<string, unknown> },
			input: unknown,
			callOptions: FeishuServiceCallOptions | undefined,
		) => {
			assertOpen();
			const parsed = parseInput(inputSchema, input);
			if (mode === 'write' && parsed.dryRun !== true) assertWritable();
			// A dry run has no effect, so it needs neither a writable service nor high-risk confirmation.
			const prepared = await prepareFeishuApiCall(mode, (parsed.dryRun === true ? { ...parsed, confirmHighRisk: true } : parsed) as never);
			assertOpen();
			if (parsed.dryRun === true) {
				return feishuOutput(apiSchema.FeishuCallApiOutputSchema, { id: parsed.id, dryRun: true, request: prepared.request });
			}
			const openApi = getOpenApi();
			const timeout = feishuTimeout(callOptions) ?? options.timeoutMs;
			return feishuCall(signalFor(callOptions), async (signal) => feishuOutput(
				apiSchema.FeishuCallApiOutputSchema, await executeFeishuApiCall(openApi, prepared, signal),
			), timeout);
		};

		const service: IFeishuService = {
			type: 'feishu',
			readOnly,
			sendMessage: (input, callOptions) => openApiCall('write', FeishuSendMessageInputSchema, input, callOptions,
				async (client, { to, text }, signal) => feishuOutput(FeishuSendMessageOutputSchema, await client.sendMessage({
					receiveId: to, receiveIdType: receiveIdTypeOf(to), msgType: 'text', content: JSON.stringify({ text }),
				}, { signal }))),
			async sendWebhook(input, callOptions) {
				assertWritable();
				const webhookUrl = resolveCredential(getEnv, options.webhookUrlEnv);
				const webhookSecret = resolveCredential(getEnv, options.webhookSecretEnv);
				if (webhookUrl === undefined) {
					throw new FeishuServiceError(
						FeishuServiceErrorCodes.MissingWebhookConfig,
						'Feishu sendWebhook requires webhookUrlEnv',
					);
				}
				const signal = signalFor(callOptions);
				return feishuCall(signal, async () => {
					if (callOptions?.context?.timeoutMs !== undefined) throw new FeishuServiceError(
						FeishuServiceErrorCodes.InvalidConfig, 'Feishu webhook does not support timeoutMs',
					);
					const parsed = FeishuSendWebhookInputSchema.parse(input);
					return feishuOutput(FeishuSendWebhookOutputSchema, await sendWebhook({
						url: webhookUrl,
						secret: webhookSecret,
						text: parsed.text,
						markdown: parsed.markdown,
						fetch: (url, init) => {
							signal.throwIfAborted();
							return (context.fetch as FetchLike)(url, { ...init, signal });
						},
					}));
				});
			},
			request: (input, callOptions) => openApiCall('write', FeishuRequestInputSchema, input, callOptions,
				(client, { path, method, body, params }, signal) => client.request({ path, method, body, query: params }, { signal })),
			listChat: (input, callOptions) => openApiCall('read', schema.FeishuListChatInputSchema, input, callOptions,
				async (client, value, signal) => feishuOutput(schema.FeishuListChatOutputSchema, await client.listChats(value, { signal }))),
			getChat: (input, callOptions) => openApiCall('read', schema.FeishuGetChatInputSchema, input, callOptions,
				async (client, value, signal) => feishuOutput(schema.FeishuGetChatOutputSchema, await client.getChat(value, { signal }))),
			listChatMember: (input, callOptions) => openApiCall('read', schema.FeishuListChatMemberInputSchema, input, callOptions,
				async (client, value, signal) => feishuOutput(schema.FeishuListChatMemberOutputSchema, await client.listChatMembers(value, { signal }))),
			getUser: (input, callOptions) => openApiCall('read', schema.FeishuGetUserInputSchema, input, callOptions,
				async (client, value, signal) => {
					const userIdType = value.userIdType ?? 'open_id';
					let userId = value.userId;
					if (value.email !== undefined) {
						// Same operation, same cached tenant token: lookup then detail.
						const [match] = await client.batchGetUserId({ emails: [value.email], userIdType }, { signal });
						userId = typeof match?.user_id === 'string' && match.user_id ? match.user_id : undefined;
						if (!userId) throw new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, 'Feishu user not found');
					}
					return feishuOutput(schema.FeishuGetUserOutputSchema, await client.getUser({ userId: userId!, userIdType }, { signal }));
				}),
			listMessage: (input, callOptions) => openApiCall('read', schema.FeishuListMessageInputSchema, input, callOptions,
				async (client, { chatId, ...rest }, signal) => feishuOutput(schema.FeishuListMessageOutputSchema,
					await client.listMessages({ ...rest, containerId: chatId, containerIdType: 'chat' }, { signal }))),
			getMessage: (input, callOptions) => openApiCall('read', schema.FeishuGetMessageInputSchema, input, callOptions,
				async (client, value, signal) => feishuOutput(schema.FeishuGetMessageOutputSchema, { items: await client.getMessage(value, { signal }) })),
			replyMessage: (input, callOptions) => openApiCall('write', schema.FeishuReplyMessageInputSchema, input, callOptions,
				async (client, { messageId, text, content, msgType, replyInThread, uuid }, signal) => feishuOutput(
					schema.FeishuReplyMessageOutputSchema,
					await client.replyMessage({
						messageId, replyInThread, uuid,
						msgType: text !== undefined ? 'text' : msgType!,
						content: text !== undefined ? JSON.stringify({ text }) : content!,
					}, { signal }),
				)),
			deleteMessage: (input, callOptions) => openApiCall('write', schema.FeishuDeleteMessageInputSchema, input, callOptions,
				async (client, value, signal) => {
					await client.deleteMessage(value, { signal });
					return { messageId: value.messageId, deleted: true as const };
				}),
			addMessageReaction: (input, callOptions) => openApiCall('write', schema.FeishuAddMessageReactionInputSchema, input, callOptions,
				async (client, value, signal) => feishuOutput(schema.FeishuMessageReactionOutputSchema, await client.addMessageReaction(value, { signal }))),
			deleteMessageReaction: (input, callOptions) => openApiCall('write', schema.FeishuDeleteMessageReactionInputSchema, input, callOptions,
				async (client, value, signal) => feishuOutput(schema.FeishuMessageReactionOutputSchema, await client.deleteMessageReaction(value, { signal }))),
			uploadImage: (input, callOptions) => openApiCall('write', schema.FeishuUploadImageInputSchema, input, callOptions,
				async (client, value, signal) => feishuOutput(schema.FeishuUploadImageOutputSchema, await client.uploadImage(value, { signal }))),
			uploadFile: (input, callOptions) => openApiCall('write', schema.FeishuUploadFileInputSchema, input, callOptions,
				async (client, value, signal) => feishuOutput(schema.FeishuUploadFileOutputSchema, await client.uploadFile(value, { signal }))),
			downloadMessageResource: (input, callOptions) => openApiCall('read', schema.FeishuDownloadMessageResourceInputSchema, input, callOptions,
				async (client, value, signal) => feishuOutput(schema.FeishuDownloadMessageResourceOutputSchema, await client.getMessageResource(value, { signal }))),
			// Catalog lookups need neither credentials nor HTTP.
			listApi: async (input) => {
				assertOpen();
				return feishuOutput(apiSchema.FeishuListApiOutputSchema, await listFeishuApi(parseInput(apiSchema.FeishuListApiInputSchema, input)));
			},
			describeApi: async (input) => {
				assertOpen();
				return feishuOutput(apiSchema.FeishuDescribeApiOutputSchema, await describeFeishuApi(parseInput(apiSchema.FeishuDescribeApiInputSchema, input).id));
			},
			callReadApi: (input, callOptions) => genericCall('read', apiSchema.FeishuCallReadApiInputSchema, input, callOptions),
			callWriteApi: (input, callOptions) => genericCall('write', apiSchema.FeishuCallWriteApiInputSchema, input, callOptions),
			close() {
				if (!closePromise) {
					closed = true;
					controller.abort(new FeishuServiceError(FeishuServiceErrorCodes.Closed, 'Feishu service is closed'));
					closePromise = Promise.resolve();
				}
				return closePromise;
			},
			[Symbol.asyncDispose]() {
				return this.close();
			},
		};
		return { feishu: service };
	},
} satisfies ServiceProviderDefinition<IFeishuService>;
