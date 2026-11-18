import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ISystemService } from './ISystemService';
import {
	createSystemService,
	createSystemServiceProvider,
	SystemOperations,
	SystemServiceContract,
	type ISystemServiceContract,
} from './index';

const host = { application: 'app', version: '1.0.0', platform: 'test', nested: { a: 1 } };

describe('System service contract', () => {
	it('aligns contract, operations and service keys', () => {
		expect(Object.keys(SystemOperations).sort()).toEqual(Object.keys(SystemServiceContract).sort());
		expect(Object.keys(createSystemServiceProvider(host).operations ?? {}).sort()).toEqual(['echo', 'info']);
		expectTypeOf<keyof ISystemServiceContract>().toEqualTypeOf<keyof typeof SystemServiceContract>();
		expectTypeOf<ISystemService['echo']>().toEqualTypeOf<ISystemServiceContract['echo']>();
	});

	it('exposes AJV-compilable read-only tool schemas', () => {
		const ajv = new Ajv2020({ strict: false });
		for (const operation of Object.values(SystemOperations)) {
			expect(operation.tool.annotations?.readOnlyHint).toBe(true);
			expect(operation.tool.description).toBeTruthy();
			expect(() => ajv.compile(operation.tool.inputSchema)).not.toThrow();
		}
		const echo = ajv.compile(SystemOperations.echo.tool.inputSchema);
		expect(echo({ text: 'x' })).toBe(true);
		expect(echo({})).toBe(false);
	});

	it('defaults info input to an empty object', () => {
		expect(SystemOperations.info.input.safeParse(undefined)).toEqual({ success: true, data: {} });
	});

	it('validates echo input', async () => {
		expect(SystemOperations.echo.input.safeParse({ text: 1 }).success).toBe(false);
		expect(SystemOperations.echo.input.safeParse({}).success).toBe(false);
		const service = createSystemService(host);
		await expect(service.echo({ text: 'hi' })).resolves.toEqual({ text: 'hi' });
		await expect(service.echo({} as never)).rejects.toThrow('system echo requires a text string');
	});

	it('passes host info through info output', async () => {
		const provider = createSystemServiceProvider(host);
		const { system } = await provider.create({} as never);
		const info = await system!.info({});
		expect(info).toEqual(host);
		expect(SystemServiceContract.info['~orpc'].outputSchema?.safeParse(info).success).toBe(true);
	});
});
