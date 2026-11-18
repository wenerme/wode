import Ajv2020 from 'ajv/dist/2020.js';
import type { ContractRouterClient } from '@orpc/contract';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import {
	GrafanaServiceContract, GrafanaGetDashboardOutputSchema, GrafanaPatchPanelInputSchema,
	GrafanaPatchPanelOutputSchema, GrafanaUpdateDashboardOutputSchema, GrafanaWriteOperations,
	type IGrafanaServiceContract, type GrafanaServiceInputs, type GrafanaServiceOutputs, type GrafanaServiceClientContext,
} from './GrafanaServiceContract';
import type { IGrafanaService } from './IGrafanaService';

describe('Grafana oRPC contract', () => {
	it('derives service inputs and outputs from the contract', () => {
		expectTypeOf<IGrafanaServiceContract>().toEqualTypeOf<ContractRouterClient<typeof GrafanaServiceContract, GrafanaServiceClientContext>>();
		expectTypeOf<keyof IGrafanaServiceContract>().toEqualTypeOf<keyof typeof GrafanaServiceContract>();
		expectTypeOf<Parameters<IGrafanaService['patchPanel']>[0]>().toEqualTypeOf<GrafanaServiceInputs['patchPanel']>();
		expectTypeOf<Awaited<ReturnType<IGrafanaService['patchPanel']>>>().toEqualTypeOf<GrafanaServiceOutputs['patchPanel']>();
		expectTypeOf<Awaited<ReturnType<IGrafanaService['patchPanel']>>['changed']>().toEqualTypeOf<boolean>();
	});

	it('derives optional empty inputs from contract defaults', () => {
		for (const name of ['health', 'whoami', 'listDashboard'] as const) {
			expect(GrafanaServiceContract[name]['~orpc'].inputSchema!.parse(undefined)).toEqual({});
		}
		expect(GrafanaServiceContract.getDashboard['~orpc'].inputSchema!.safeParse(undefined).success).toBe(false);
	});

	it('validates exactly one edit mode in both Zod and the exported JSON Schema', () => {
		const schema = toJsonSchema(GrafanaPatchPanelInputSchema);
		const validate = new Ajv2020({ strict: false }).compile(schema);
		const base = { dashboardUid: 'dash-1', panelId: 1 };
		for (const edit of [{ set: { title: 'CPU' } }, { merge: { options: { legend: true } } }, { replace: { id: 1, pluginOption: { x: 2 } } }]) {
			expect(GrafanaPatchPanelInputSchema.safeParse({ ...base, ...edit }).success).toBe(true);
			expect(validate({ ...base, ...edit })).toBe(true);
		}
		for (const edit of [{}, { set: {}, merge: {} }, { set: {}, replace: { id: 1 } }, { merge: {}, replace: { id: 1 } }, { replace: null }, { replace: [] }]) {
			expect(GrafanaPatchPanelInputSchema.safeParse({ ...base, ...edit }).success).toBe(false);
			expect(validate({ ...base, ...edit })).toBe(false);
		}
	});

	it.each(['set', 'merge'])('rejects raw %s prototype keys instead of silently dropping part of an edit', (mode) => {
		const edit = JSON.parse('{"__proto__":{"polluted":true},"title":"CPU"}');
		expect(GrafanaPatchPanelInputSchema.safeParse({ dashboardUid: 'd', panelId: 1, [mode]: edit }).success).toBe(false);
		expect(Object.keys(edit)).toEqual(['__proto__', 'title']);
	});

	it('preserves plugin content and dashboard metadata while validating stable fields', () => {
		const value = { dashboard: { uid: 'dash-1', panels: [{ id: 1, options: { custom: ['a'] }, panels: [{ id: 2, title: 'Nested' }] }], custom: { value: 2 } }, meta: { folderUid: 'folder-1', custom: true } };
		expect(GrafanaGetDashboardOutputSchema.parse(value)).toEqual(value);
		expect(GrafanaGetDashboardOutputSchema.safeParse({ dashboard: { panels: [{ title: 'Missing ID' }] } }).success).toBe(false);
		expect(GrafanaGetDashboardOutputSchema.safeParse({ dashboard: [] }).success).toBe(false);
	});

	it('retains the patch result shape and original save response extension fields', () => {
		const value = { changed: true, panel: { id: 1, options: { custom: true } }, dashboard: { uid: 'dash-1', version: 3 }, dryRun: true, status: 'preview' };
		expect(GrafanaPatchPanelOutputSchema.parse(value)).toEqual(value);
		expect(GrafanaPatchPanelOutputSchema.safeParse({ status: 'success' }).success).toBe(false);
	});

	it('distinguishes a local un-compared preview from a real save result', () => {
		const preview = { dryRun: true, changed: true, compared: false, dashboard: { uid: 'dash-1' }, overwrite: false };
		expect(GrafanaUpdateDashboardOutputSchema.parse(preview)).toEqual(preview);
		expect(GrafanaUpdateDashboardOutputSchema.safeParse({ ...preview, compared: undefined }).success).toBe(false);
		expect(GrafanaUpdateDashboardOutputSchema.parse({ uid: 'dash-1', status: 'success', version: 2 })).toMatchObject({ version: 2 });
	});

	it('keeps only the generic request output unconstrained and describes each tool', () => {
		const ajv = new Ajv2020({ strict: false });
		for (const [name, procedure] of Object.entries(GrafanaServiceContract)) {
			expect(procedure['~orpc'].meta.description).toBeTruthy();
			const output = toJsonSchema(procedure['~orpc'].outputSchema!);
			if (name !== 'request') expect(output.type || output.anyOf).toBeTruthy();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].inputSchema!))).not.toThrow();
			expect(() => ajv.compile(output)).not.toThrow();
		}
		expect([...GrafanaWriteOperations]).toEqual(['request', 'updateDashboard', 'patchPanel']);
	});
});
