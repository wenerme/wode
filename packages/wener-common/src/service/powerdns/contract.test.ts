import Ajv2020 from 'ajv/dist/2020.js';
import type { ContractRouterClient } from '@orpc/contract';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import type { IPowerDnsService } from './IPowerDnsService';
import { PowerDnsOperations } from './operations';
import {
	PowerDnsRequestInputSchema,
	PowerDnsServiceContract,
	PowerDnsWriteOperations,
	type IPowerDnsServiceContract,
	type PowerDnsServiceClientContext,
	type PowerDnsServiceInputs,
	type PowerDnsServiceOutputs,
} from './PowerDnsServiceContract';

describe('PowerDNS oRPC contract', () => {
	it('derives the service interface from the contract', () => {
		expectTypeOf<IPowerDnsServiceContract>().toEqualTypeOf<ContractRouterClient<typeof PowerDnsServiceContract, PowerDnsServiceClientContext>>();
		expectTypeOf<keyof IPowerDnsServiceContract>().toEqualTypeOf<keyof typeof PowerDnsServiceContract>();
		expectTypeOf<Parameters<IPowerDnsService['setMetadata']>[0]>().toEqualTypeOf<PowerDnsServiceInputs['setMetadata']>();
		expectTypeOf<Awaited<ReturnType<IPowerDnsService['setMetadata']>>>().toEqualTypeOf<PowerDnsServiceOutputs['setMetadata']>();
		for (const name of ['listZone', 'getZone', 'createZone', 'deleteZone', 'listRecord', 'setRecord', 'deleteRecord', 'replaceRrset', 'deleteRrset']) expect(Object.hasOwn(PowerDnsServiceContract, name)).toBe(false);
		expect(Object.keys(PowerDnsOperations)).toEqual(Object.keys(PowerDnsServiceContract));
	});

	it('defaults optional empty inputs', () => {
		for (const name of ['listServer', 'getServer', 'listServerStatistic', 'listTsigKey'] as const)
			expect(PowerDnsServiceContract[name]['~orpc'].inputSchema!.parse(undefined)).toEqual({});
		expect(PowerDnsServiceContract.listMetadata['~orpc'].inputSchema!.safeParse(undefined).success).toBe(false);
	});

	it('compiles every input/output JSON Schema and describes each tool', () => {
		const ajv = new Ajv2020({ strict: false });
		for (const procedure of Object.values(PowerDnsServiceContract)) {
			expect(procedure['~orpc'].meta.description).toBeTruthy();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].inputSchema!))).not.toThrow();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].outputSchema!))).not.toThrow();
		}
	});

	it('marks write operations and dry-run support in metadata', () => {
		expect([...PowerDnsWriteOperations].sort()).toEqual([
			'createCryptokey', 'createPowerDnsZone', 'createTsigKey', 'deleteCryptokey', 'deleteMetadata', 'deleteTsigKey',
			'notifyZone', 'request', 'retrieveZoneAxfr', 'setMetadata', 'updateCryptokey', 'updateTsigKey',
		]);
		for (const name of ['deleteMetadata', 'deleteCryptokey', 'deleteTsigKey', 'request'] as const)
			expect(PowerDnsServiceContract[name]['~orpc'].meta.destructiveHint).toBe(true);
		const dryRun = Object.entries(PowerDnsServiceContract).filter(([, p]) => p['~orpc'].meta.supportsDryRun).map(([key]) => key);
		expect(dryRun).toEqual(['createPowerDnsZone']);
		const create = PowerDnsServiceContract.createPowerDnsZone['~orpc'].inputSchema!;
		expect(create.safeParse({ zone: 'example.com', kind: 'Slave', masters: ['192.0.2.53'] }).success).toBe(true);
		expect(create.safeParse({ zone: 'example.com', kind: 'Native', masters: ['192.0.2.53'] }).success).toBe(false);
		expect(create.safeParse({ zone: 'example.com', kind: 'Hidden' }).success).toBe(false);
	});

	it('restricts raw request paths in the schema', () => {
		expect(PowerDnsRequestInputSchema.safeParse({ path: '/servers/localhost' }).success).toBe(true);
		expect(PowerDnsRequestInputSchema.safeParse({ path: '/api/v1/servers' }).success).toBe(true);
		for (const path of ['servers', '//evil.example', '/servers/../x', '/x#y'])
			expect(PowerDnsRequestInputSchema.safeParse({ path }).success).toBe(false);
	});

	it('rejects dot path segments in server, zone, kind and TSIG id', () => {
		const c = PowerDnsServiceContract;
		const ok = (name: keyof typeof c, input: unknown) => c[name]['~orpc'].inputSchema!.safeParse(input).success;
		expect(ok('listMetadata', { zone: '.' })).toBe(true);
		expect(ok('notifyZone', { zone: '..' })).toBe(false);
		expect(ok('getServer', { server: '..' })).toBe(false);
		expect(ok('getServer', { server: '.' })).toBe(false);
		expect(ok('deleteMetadata', { zone: 'example.com', kind: '..' })).toBe(false);
		expect(ok('getMetadata', { zone: 'example.com', kind: '.' })).toBe(false);
		expect(ok('deleteTsigKey', { id: '..' })).toBe(false);
		expect(ok('updateTsigKey', { id: 'a/b', name: 'x' })).toBe(false);
		expect(ok('deleteTsigKey', { id: 'transfer.' })).toBe(true);
	});
});
