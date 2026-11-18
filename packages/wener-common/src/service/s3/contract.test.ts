import type { ContractRouterClient } from '@orpc/contract';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import type { IS3Service, S3GetObjectInput, S3PutObjectResult } from './IS3Service';
import {
	S3ServiceContract, S3ListObjectInputSchema, S3ListObjectOutputSchema, S3GetObjectOutputSchema,
	S3DeleteObjectOutputSchema, S3PutObjectOutputSchema, S3WriteOperations,
	type IS3ServiceContract, type S3ServiceClientContext, type S3ServiceInputs, type S3ServiceOutputs,
} from './S3ServiceContract';
import { S3ServiceContract as BarrelServiceContract, S3ServiceProvider } from './index';
import { S3Operations } from './operations';

describe('S3 service contract', () => {
	it('derives method keys, inputs, outputs and context using the native contract client', () => {
		expectTypeOf<IS3ServiceContract>().toEqualTypeOf<ContractRouterClient<typeof S3ServiceContract, S3ServiceClientContext>>();
		expectTypeOf<keyof IS3ServiceContract>().toEqualTypeOf<keyof typeof S3ServiceContract>();
		expectTypeOf<Parameters<IS3Service['listObject']>[0]>().toEqualTypeOf<S3ServiceInputs['listObject']>();
		expectTypeOf<Parameters<IS3Service['getObject']>[0]>().toEqualTypeOf<S3GetObjectInput>();
		expectTypeOf<Awaited<ReturnType<IS3Service['listObject']>>>().toEqualTypeOf<S3ServiceOutputs['listObject']>();
		expectTypeOf<Awaited<ReturnType<IS3Service['getObject']>>>().toEqualTypeOf<string | null>();
		expectTypeOf<Awaited<ReturnType<IS3Service['putObject']>>>().toEqualTypeOf<S3PutObjectResult>();
		expectTypeOf<Awaited<ReturnType<IS3Service['deleteObject']>>>().toEqualTypeOf<boolean>();
		expectTypeOf<IS3Service>().toExtend<AsyncDisposable>();
	});

	it('defaults only the optional list input without inventing key defaults', () => {
		expect(S3ListObjectInputSchema.parse(undefined)).toEqual({});
		for (const name of ['getObject', 'putObject', 'deleteObject'] as const)
			expect(S3ServiceContract[name]['~orpc'].inputSchema!.safeParse(undefined).success).toBe(false);
		expect(S3ListObjectInputSchema.safeParse({ maxKeys: 0 }).success).toBe(false);
		expect(S3ListObjectInputSchema.safeParse({ delimiter: '' }).success).toBe(false);
	});

	it('re-exports the canonical contract from the barrel', () => {
		expect(BarrelServiceContract).toBe(S3ServiceContract);
	});

	it('aligns operations, provider tools, keys and read-only metadata', () => {
		const keys = ['listObject', 'getObject', 'putObject', 'deleteObject'];
		const tools = createServiceProviderAdapter(S3ServiceProvider).tools!;
		expect(Object.keys(S3ServiceContract)).toEqual(keys);
		expect(Object.keys(S3Operations)).toEqual(keys);
		expect(Object.keys(tools)).toEqual(keys);
		for (const name of keys) {
			expect(tools[name].annotations).toMatchObject({
				readOnlyHint: !S3WriteOperations.has(name), destructiveHint: S3WriteOperations.has(name),
			});
		}
	});

	it('preserves SDK metadata extension fields while using a JSON-safe date boundary', () => {
		const objects = [{
			Key: 'prefix/file', Size: 0, LastModified: '2026-11-12T00:00:00.000Z', ETag: '"etag"', StorageClass: '',
			VersionId: 'version', IsLatest: true, IsDeleteMarker: false, custom: { dynamic: ['value', 42] },
		}];
		expect(S3ListObjectOutputSchema.parse(objects)).toEqual(objects);
		expect(S3ListObjectOutputSchema.parse([{ ...objects[0], LastModified: null }])).toMatchObject([{ LastModified: null }]);
		expect(S3ListObjectOutputSchema.parse(null)).toBeNull();
		expect(S3ListObjectOutputSchema.parse([])).toEqual([]);
		expect(S3ListObjectOutputSchema.safeParse([{ Key: 'missing metadata' }]).success).toBe(false);
		expect(S3ListObjectOutputSchema.safeParse([{ ...objects[0], LastModified: new Date() }]).success).toBe(false);
	});

	it('rejects binary/encoding envelopes for the text operation instead of silently serializing bytes', () => {
		expect(S3GetObjectOutputSchema.parse('')).toBe('');
		expect(S3GetObjectOutputSchema.parse(null)).toBeNull();
		for (const value of [new ArrayBuffer(2), new Uint8Array([0, 255]), { bytes: [0, 255], encoding: 'base64' }, { 0: 255 }])
			expect(S3GetObjectOutputSchema.safeParse(value).success).toBe(false);
		expect(S3DeleteObjectOutputSchema.safeParse({ deleted: true }).success).toBe(false);
		expect(S3PutObjectOutputSchema.safeParse({ ok: true, status: 200.5 }).success).toBe(false);
	});

	it('exports AJV-compilable inputs and outputs with meaningful validation', () => {
		const ajv = new Ajv2020({ strict: false, validateFormats: false });
		for (const procedure of Object.values(S3ServiceContract)) {
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].inputSchema!))).not.toThrow();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].outputSchema!))).not.toThrow();
		}
		const get = ajv.compile(toJsonSchema(S3GetObjectOutputSchema));
		expect(get('text')).toBe(true);
		expect(get(null)).toBe(true);
		expect(get({ bytes: [1] })).toBe(false);
		const list = ajv.compile(toJsonSchema(S3ListObjectOutputSchema));
		expect(list([{ Key: 'x' }])).toBe(false);
		expect(list([{ Key: 'x', Size: 1, LastModified: null, ETag: '', StorageClass: '', dynamic: true }])).toBe(true);
	});
});
