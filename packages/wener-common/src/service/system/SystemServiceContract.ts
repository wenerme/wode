import {
	oc,
	type ContractRouterClient,
	type InferContractRouterInputs,
	type InferContractRouterOutputs,
} from '@orpc/contract';
import type { ServiceToolMeta } from '../runtime/contract';
import { z } from 'zod';

const readOnlyTool = { readOnlyHint: true, destructiveHint: false } satisfies ServiceToolMeta;

export const SystemInfoInputSchema = z.strictObject({}).default({});
/** Application identity plus host-injected runtime information (passthrough). */
export const SystemInfoOutputSchema = z.looseObject({ application: z.string(), version: z.string() });
export const SystemEchoInputSchema = z.strictObject({ text: z.string() });
export const SystemEchoOutputSchema = z.object({ text: z.string() });

export const SystemServiceContract = {
	info: oc
		.input(SystemInfoInputSchema)
		.output(SystemInfoOutputSchema)
		.meta({ ...readOnlyTool, description: 'Runtime environment information' }),
	echo: oc
		.input(SystemEchoInputSchema)
		.output(SystemEchoOutputSchema)
		.meta({ ...readOnlyTool, description: 'Return the input text' }),
};

export type SystemServiceInputs = InferContractRouterInputs<typeof SystemServiceContract>;
export type SystemServiceOutputs = InferContractRouterOutputs<typeof SystemServiceContract>;
export type SystemServiceClientContext = Record<string, never>;
export type ISystemServiceContract = ContractRouterClient<typeof SystemServiceContract, SystemServiceClientContext>;
