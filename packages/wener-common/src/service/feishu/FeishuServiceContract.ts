import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';
import * as s from './schema';
import * as api from './api.schema';

const feishu = oc.$meta<ServiceToolMeta>({});
/** The original send/webhook/request tools keep their metadata unchanged. */
const writeTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };
const read = (description: string): ServiceToolMeta => ({ readOnlyHint: true, destructiveHint: false, description });
const write = (description: string): ServiceToolMeta => ({ readOnlyHint: false, destructiveHint: false, description });
const destructive = (description: string): ServiceToolMeta => ({ readOnlyHint: false, destructiveHint: true, description });

export const FeishuSendMessageInputSchema = z.strictObject({
	to: z.string().min(1),
	text: z.string().min(1).max(10_000),
});
export const FeishuSendMessageOutputSchema = z.looseObject({
	code: z.number(),
	msg: z.string().optional(),
	data: s.FeishuMessageSchema.optional(),
});

/** Connection parameters belong to service configuration, never to tool inputs. */
export const FeishuSendWebhookInputSchema = z.strictObject({
	text: z.string().min(1).max(10_000).optional(),
	markdown: z.string().min(1).max(10_000).optional(),
});
/** Feishu returns code/msg; legacy StatusCode/StatusMessage may coexist. */
export const FeishuSendWebhookOutputSchema = z.looseObject({
	code: z.number(),
	msg: z.string().optional(),
	StatusCode: z.number().optional(),
	StatusMessage: z.string().optional(),
	data: z.record(z.string(), z.unknown()).optional(),
});

export const FeishuRequestInputSchema = z.strictObject({
	path: z.string().min(1).max(2048),
	method: z.string().min(1).max(16).optional(),
	params: z.record(z.string(), z.string()).optional(),
	body: s.optionalDynamicValue,
});
/** Raw OpenAPI calls return the JSON envelope, text for text/*, or a bounded Blob otherwise. */
export const FeishuRequestOutputSchema = z.unknown();

/**
 * Canonical in-process contract. Binary uploads and downloads use `Uint8Array`; tools and remote
 * clients use {@link FeishuServiceWireContract}, which differs only in those three procedures.
 */
export const FeishuServiceContract = {
	sendMessage: feishu.input(FeishuSendMessageInputSchema).output(FeishuSendMessageOutputSchema).meta(writeTool),
	sendWebhook: feishu.input(FeishuSendWebhookInputSchema).output(FeishuSendWebhookOutputSchema).meta(writeTool),
	request: feishu.input(FeishuRequestInputSchema).output(FeishuRequestOutputSchema).meta(writeTool),
	listChat: feishu.input(s.FeishuListChatInputSchema).output(s.FeishuListChatOutputSchema)
		.meta(read('List chats the app bot belongs to, paginated with pageToken.')),
	getChat: feishu.input(s.FeishuGetChatInputSchema).output(s.FeishuGetChatOutputSchema).meta(read('Get chat information.')),
	listChatMember: feishu.input(s.FeishuListChatMemberInputSchema).output(s.FeishuListChatMemberOutputSchema)
		.meta(read('List chat members, paginated with pageToken.')),
	getUser: feishu.input(s.FeishuGetUserInputSchema).output(s.FeishuGetUserOutputSchema)
		.meta(read('Get a contact user by id, or by email through batch_get_id.')),
	listMessage: feishu.input(s.FeishuListMessageInputSchema).output(s.FeishuListMessageOutputSchema)
		.meta(read('List chat messages, paginated with pageToken.')),
	getMessage: feishu.input(s.FeishuGetMessageInputSchema).output(s.FeishuGetMessageOutputSchema).meta(read('Get a message.')),
	replyMessage: feishu.input(s.FeishuReplyMessageInputSchema).output(s.FeishuReplyMessageOutputSchema)
		.meta(write('Reply to a message; requires a writable service.')),
	deleteMessage: feishu.input(s.FeishuDeleteMessageInputSchema).output(s.FeishuDeleteMessageOutputSchema)
		.meta(destructive('Recall (delete) a message sent by the app; requires a writable service.')),
	addMessageReaction: feishu.input(s.FeishuAddMessageReactionInputSchema).output(s.FeishuMessageReactionOutputSchema)
		.meta(write('Add an emoji reaction to a message; requires a writable service.')),
	deleteMessageReaction: feishu.input(s.FeishuDeleteMessageReactionInputSchema).output(s.FeishuMessageReactionOutputSchema)
		.meta(destructive('Remove a reaction added by the app; requires a writable service.')),
	uploadImage: feishu.input(s.FeishuUploadImageInputSchema).output(s.FeishuUploadImageOutputSchema)
		.meta(write('Upload an image (at most 10 MiB) for messages; requires a writable service.')),
	uploadFile: feishu.input(s.FeishuUploadFileInputSchema).output(s.FeishuUploadFileOutputSchema)
		.meta(write('Upload a file (at most 30 MiB) for messages; requires a writable service.')),
	downloadMessageResource: feishu.input(s.FeishuDownloadMessageResourceInputSchema).output(s.FeishuDownloadMessageResourceOutputSchema)
		.meta(read('Download an image or file attached to a message, bounded by maxBytes.')),
	listApi: feishu.input(api.FeishuListApiInputSchema).output(api.FeishuListApiOutputSchema)
		.meta(read('List generic Feishu OpenAPI catalog entries with availability; filter by service, risk or text.')),
	describeApi: feishu.input(api.FeishuDescribeApiInputSchema).output(api.FeishuDescribeApiOutputSchema)
		.meta(read('Describe a catalog API with JSON Schemas of path parameters, query, body and response data.')),
	callReadApi: feishu.input(api.FeishuCallReadApiInputSchema).output(api.FeishuCallApiOutputSchema)
		.meta(read('Call a read-risk catalog API by id with a tenant token; rejects write APIs. dryRun returns the built request.')),
	callWriteApi: feishu.input(api.FeishuCallWriteApiInputSchema).output(api.FeishuCallApiOutputSchema)
		.meta({
			...destructive('Call a write or high-risk-write catalog API by id; requires a writable service, and confirmHighRisk for high-risk-write. dryRun returns the built request without credentials or HTTP.'),
			supportsDryRun: true,
		}),
};

/** Transport contract: reuses every procedure except the bounded Base64 binary projections. */
export const FeishuServiceWireContract = {
	...FeishuServiceContract,
	uploadImage: feishu.input(s.FeishuUploadImageWireInputSchema).output(s.FeishuUploadImageOutputSchema)
		.meta(FeishuServiceContract.uploadImage['~orpc'].meta),
	uploadFile: feishu.input(s.FeishuUploadFileWireInputSchema).output(s.FeishuUploadFileOutputSchema)
		.meta(FeishuServiceContract.uploadFile['~orpc'].meta),
	downloadMessageResource: feishu.input(s.FeishuDownloadMessageResourceInputSchema).output(s.FeishuDownloadMessageResourceWireOutputSchema)
		.meta(FeishuServiceContract.downloadMessageResource['~orpc'].meta),
};

export type FeishuOperationName = keyof typeof FeishuServiceContract;
/** Derived from contract metadata; read operations are allowed on read-only services. */
export const FeishuWriteOperations: ReadonlySet<FeishuOperationName> = new Set(
	(Object.keys(FeishuServiceContract) as FeishuOperationName[]).filter(
		(name) => FeishuServiceContract[name]['~orpc'].meta.readOnlyHint !== true,
	),
);

export type FeishuServiceInputs = InferContractRouterInputs<typeof FeishuServiceContract>;
export type FeishuServiceOutputs = InferContractRouterOutputs<typeof FeishuServiceContract>;
export type FeishuServiceWireInputs = InferContractRouterInputs<typeof FeishuServiceWireContract>;
export type FeishuServiceWireOutputs = InferContractRouterOutputs<typeof FeishuServiceWireContract>;
/** timeoutMs bounds the entire app operation, including token exchange, and its HTTP request. */
export type FeishuServiceClientContext = { timeoutMs?: number };
export type IFeishuServiceContract = ContractRouterClient<typeof FeishuServiceContract, FeishuServiceClientContext>;
export type FeishuServiceCallOptions = NonNullable<Parameters<IFeishuServiceContract['request']>[1]>;
