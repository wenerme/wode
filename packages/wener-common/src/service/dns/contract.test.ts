import Ajv2020 from 'ajv/dist/2020.js';
import type { ContractRouterClient } from '@orpc/contract';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import {
	DnsServiceContract,
	DnsWriteOperations,
	type DnsServiceClientContext,
	type DnsServiceInputs,
	type IDnsServiceContract,
} from './DnsServiceContract';
import type { IDnsService } from './IDnsService';
import { normalizeDnsName, normalizeDnsRecordName } from './name';
import { DnsOperations } from './operations';

describe('DNS oRPC contract', () => {
	it('derives the service interface and operations from the contract', () => {
		expectTypeOf<IDnsServiceContract>().toEqualTypeOf<ContractRouterClient<typeof DnsServiceContract, DnsServiceClientContext>>();
		expectTypeOf<Parameters<IDnsService['setRecord']>[0]>().toEqualTypeOf<DnsServiceInputs['setRecord']>();
		expect(Object.keys(DnsServiceContract)).toEqual(['listZone', 'getZone', 'createZone', 'deleteZone', 'listRecord', 'setRecord', 'deleteRecord']);
		expect(Object.keys(DnsOperations)).toEqual(Object.keys(DnsServiceContract));
	});

	it('defaults listZone input and requires zone elsewhere', () => {
		expect(DnsServiceContract.listZone['~orpc'].inputSchema!.parse(undefined)).toEqual({});
		expect(DnsServiceContract.getZone['~orpc'].inputSchema!.safeParse(undefined).success).toBe(false);
	});

	it('compiles every JSON Schema and marks writes with dry-run support', () => {
		const ajv = new Ajv2020({ strict: false });
		for (const procedure of Object.values(DnsServiceContract)) {
			expect(procedure['~orpc'].meta.description).toBeTruthy();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].inputSchema!))).not.toThrow();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].outputSchema!))).not.toThrow();
		}
		expect([...DnsWriteOperations]).toEqual(['createZone', 'deleteZone', 'setRecord', 'deleteRecord']);
		for (const name of DnsWriteOperations) expect(DnsServiceContract[name as 'setRecord']['~orpc'].meta.supportsDryRun).toBe(true);
		for (const name of ['deleteZone', 'setRecord', 'deleteRecord'] as const) expect(DnsServiceContract[name]['~orpc'].meta.destructiveHint).toBe(true);
	});

	it('rejects dot segments and path characters in names', () => {
		const parse = (input: unknown) => DnsServiceContract.deleteRecord['~orpc'].inputSchema!.safeParse(input).success;
		expect(parse({ zone: 'example.com', name: '@', type: 'A' })).toBe(true);
		expect(parse({ zone: '.', name: 'example', type: 'NS' })).toBe(true);
		for (const zone of ['..', 'a/b', 'a..b', ' ']) expect(parse({ zone, name: 'www', type: 'A' })).toBe(false);
		expect(parse({ zone: 'example.com', name: '..', type: 'A' })).toBe(false);
		expect(parse({ zone: 'example.com', name: 'www', type: 'A B' })).toBe(false);
	});

	it('accepts optional pagination input and nextCursor output', () => {
		for (const name of ['listZone', 'listRecord'] as const) {
			const input = DnsServiceContract[name]['~orpc'].inputSchema!;
			const base = name === 'listZone' ? {} : { zone: 'example.com' };
			expect(input.safeParse({ ...base, cursor: 'opaque', limit: 50 }).success).toBe(true);
			expect(input.safeParse({ ...base, limit: 0 }).success).toBe(false);
			expect(input.safeParse({ ...base, cursor: '' }).success).toBe(false);
		}
		const zones = DnsServiceContract.listZone['~orpc'].outputSchema!;
		expect(zones.safeParse({ zones: [] }).success).toBe(true);
		expect(zones.safeParse({ zones: [], nextCursor: 'next' }).success).toBe(true);
		expect(zones.safeParse([]).success).toBe(false);
		const records = DnsServiceContract.listRecord['~orpc'].outputSchema!;
		expect(records.safeParse({ rrsets: [{ name: 'a.example.com.', type: 'A', ttl: 1, values: ['192.0.2.1'] }] }).success).toBe(true);
	});

	it('documents presentation-format values in the schema', () => {
		const schema = JSON.stringify(toJsonSchema(DnsServiceContract.setRecord['~orpc'].inputSchema!));
		expect(schema).toContain('RFC 1035 presentation');
		expect(schema).toContain('disabled ones');
	});

	it('canonicalizes names with a trailing dot', () => {
		expect(normalizeDnsName('example.com')).toBe('example.com.');
		expect(normalizeDnsName('.')).toBe('.');
		expect(normalizeDnsRecordName('@', 'example.com')).toBe('example.com.');
		expect(normalizeDnsRecordName('www', 'example.com.')).toBe('www.example.com.');
		expect(normalizeDnsRecordName('WWW.Example.com', 'example.com')).toBe('WWW.Example.com.');
		expect(normalizeDnsRecordName('com', '.')).toBe('com.');
	});
});
