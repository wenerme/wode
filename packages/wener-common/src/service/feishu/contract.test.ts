import type { ContractRouterClient } from '@orpc/contract';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { IFeishuService } from './IFeishuService';
import { FeishuServiceContract as barrel } from './index';
import {
	FeishuServiceContract, FeishuSendMessageOutputSchema, FeishuSendWebhookOutputSchema,
	type IFeishuServiceContract, type FeishuServiceClientContext,
} from './FeishuServiceContract';
import { FeishuOperations } from './operations';
import { createFeishuServiceToolClient } from './cli/client';
import type { ServiceRuntimeClient } from '../runtime/types';

const message = {
	code: 0, msg: 'success', trace: { arbitrary: [true, null] },
	data: {
		message_id: 'om_fixture', msg_type: 'future_card_type',
		body: { content: { elements: [{ tag: 'future', value: [1, null] }] } },
		sender: { id: 'ou_fixture', future: { user: true } },
		mentions: [{ future_id: 1 }], future: { nested: ['value'] },
	},
};

describe('Feishu contract migration', () => {
	it('derives the interface and keys directly from ContractRouterClient', () => {
		expectTypeOf<IFeishuServiceContract>().toEqualTypeOf<ContractRouterClient<typeof FeishuServiceContract, FeishuServiceClientContext>>();
		expectTypeOf<keyof IFeishuServiceContract>().toEqualTypeOf<keyof typeof FeishuServiceContract>();
		expectTypeOf<IFeishuService>().toExtend<IFeishuServiceContract & AsyncDisposable>();
		expectTypeOf<Parameters<IFeishuService['sendMessage']>[0]>().toEqualTypeOf<{ to: string; text: string }>();
		expectTypeOf<Awaited<ReturnType<IFeishuService['request']>>>().toEqualTypeOf<unknown>();
	});

	it('re-exports the canonical contract from the barrel', () => {
		expect(barrel).toBe(FeishuServiceContract);
	});

	it('keeps operation/schema/client keys aligned and compiles every JSON schema with AJV', async () => {
		const keys = [
			'sendMessage', 'sendWebhook', 'request', 'listChat', 'getChat', 'listChatMember', 'getUser', 'listMessage',
			'getMessage', 'replyMessage', 'deleteMessage', 'addMessageReaction', 'deleteMessageReaction', 'uploadImage',
			'uploadFile', 'downloadMessageResource', 'listApi', 'describeApi', 'callReadApi', 'callWriteApi',
		];
		expect(Object.keys(FeishuServiceContract)).toEqual(keys);
		expect(Object.keys(FeishuOperations)).toEqual(keys);
		const ajv = new Ajv2020({ strict: true, allowUnionTypes: true });
		for (const operation of Object.values(FeishuOperations)) {
			expect(ajv.compile(operation.tool.inputSchema)).toBeTypeOf('function');
			expect(ajv.compile(operation.tool.outputSchema!)).toBeTypeOf('function');
		}
		for (const name of ['sendMessage', 'sendWebhook', 'request'] as const)
			expect(FeishuOperations[name].tool.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: true });
		const runtime: ServiceRuntimeClient = {
			getSchema: vi.fn(async () => ({ tools: Object.fromEntries(Object.entries(FeishuOperations).map(([key, value]) => [key, value.tool])) })),
			call: vi.fn(async () => message),
		};
		const client = await createFeishuServiceToolClient(runtime, 'fixture', { readOnly: false });
		expect(keys.filter((key) => key in client)).toEqual(keys);
		await client[Symbol.asyncDispose]();
	});

	it('retains dynamic message/card/user and webhook fields through validation', () => {
		expect(FeishuSendMessageOutputSchema.parse(message)).toEqual(message);
		const webhook = { code: 0, msg: 'ok', StatusCode: 0, StatusMessage: 'ok', data: { future: [{ user: true }] }, future: [1] };
		expect(FeishuSendWebhookOutputSchema.parse(webhook)).toEqual(webhook);
		expect(FeishuSendWebhookOutputSchema.parse({ code: 0 })).toEqual({ code: 0 });
		expect(FeishuSendMessageOutputSchema.safeParse({ code: '0' }).success).toBe(false);
		expect(FeishuSendWebhookOutputSchema.safeParse(null).success).toBe(false);
		const ajv = new Ajv2020();
		expect(ajv.compile(FeishuOperations.sendMessage.tool.outputSchema!)(message)).toBe(true);
		expect(ajv.compile(FeishuOperations.sendWebhook.tool.outputSchema!)(webhook)).toBe(true);
	});
});
