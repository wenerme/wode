import Ajv2020 from 'ajv/dist/2020.js';
import type { ContractRouterClient } from '@orpc/contract';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import {
	TelegramApiSuccessOutputSchema, TelegramServiceContract, TelegramWriteOperations,
	TelegramServiceWireContract, type ITelegramServiceContract, type TelegramServiceClientContext, type TelegramServiceInputs, type TelegramServiceOutputs,
} from './TelegramServiceContract';
import type { ITelegramService } from './ITelegramService';

describe('Telegram oRPC contract', () => {
	it('derives the service client and service method signatures from the canonical contract', () => {
		expectTypeOf<ITelegramServiceContract>().toEqualTypeOf<ContractRouterClient<typeof TelegramServiceContract, TelegramServiceClientContext>>();
		expectTypeOf<keyof ITelegramServiceContract>().toEqualTypeOf<keyof typeof TelegramServiceContract>();
		expectTypeOf<Parameters<ITelegramService['getMe']>[0]>().toEqualTypeOf<TelegramServiceInputs['getMe']>();
		expectTypeOf<Parameters<ITelegramService['request']>[0]>().toEqualTypeOf<TelegramServiceInputs['request']>();
		expectTypeOf<Awaited<ReturnType<ITelegramService['getMe']>>>().toEqualTypeOf<TelegramServiceOutputs['getMe']>();
	});

	it('defaults getMe input and validates the structured Telegram response envelope', () => {
		expect(TelegramServiceContract.getMe['~orpc'].inputSchema!.parse(undefined)).toEqual({});
		expect(TelegramApiSuccessOutputSchema.parse({ ok: true, result: { id: 1, custom: ['preserved'] } })).toEqual({ ok: true, result: { id: 1, custom: ['preserved'] } });
		expect(TelegramApiSuccessOutputSchema.safeParse({ result: {} }).success).toBe(false);
		expect(TelegramApiSuccessOutputSchema.safeParse({ ok: true }).success).toBe(false);
	});

	it('produces AJV-compilable schemas and stable read/write metadata', () => {
		const ajv = new Ajv2020({ strict: false });
		for (const [name, procedure] of Object.entries(TelegramServiceContract)) {
			expect(procedure['~orpc'].meta.description).toBeTruthy();
			const wire = TelegramServiceWireContract[name as keyof typeof TelegramServiceWireContract];
			expect(() => ajv.compile(toJsonSchema(wire['~orpc'].inputSchema!))).not.toThrow();
			expect(() => ajv.compile(toJsonSchema(wire['~orpc'].outputSchema!))).not.toThrow();
			expect(procedure['~orpc'].meta.readOnlyHint).toBe(!TelegramWriteOperations.has(name as never));
		}
		expect([...TelegramWriteOperations]).toContain('getUpdates');
		expect([...TelegramWriteOperations]).toContain('request');
	});
});
