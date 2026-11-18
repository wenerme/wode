import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { toJsonSchema } from '../../schema';
import type { ServiceToolMeta } from '../runtime/contract';
import type { ServiceContract, ServiceTool } from '../runtime/types';
import { TtsAudioSchema, TtsAudioWireSchema, TtsRequestSchema, TtsVoiceListSchema, TtsVoiceQuerySchema } from './input';

const tts = oc.$meta<ServiceToolMeta>({});
const readOnly: ServiceToolMeta = {
	readOnlyHint: true,
	destructiveHint: false,
};

/** The bounded Base64 result used only when the local service crosses a service transport. */
export const TtsSynthesizeWireOutputSchema = TtsAudioWireSchema;

/** Canonical native output schema for the in-process service. */
export const TtsSynthesizeOutputSchema = TtsAudioSchema;

/** Canonical local oRPC procedures. Their output types describe the actual service value. */
export const TtsServiceContract = {
	synthesize: tts.input(TtsRequestSchema).output(TtsSynthesizeOutputSchema).meta({
		...readOnly,
		description: 'Synthesize text into audio bytes.',
	}),
	listVoices: tts.input(TtsVoiceQuerySchema.default({})).output(TtsVoiceListSchema).meta({
		...readOnly,
		description: 'List available voices when supported by the provider.',
	}),
};

/** Transport contract reusing the local inputs and metadata without duplicating either. */
export const TtsServiceWireContract = {
	synthesize: tts
		.input(TtsServiceContract.synthesize['~orpc'].inputSchema!)
		.output(TtsSynthesizeWireOutputSchema)
		.meta(TtsServiceContract.synthesize['~orpc'].meta),
	listVoices: TtsServiceContract.listVoices,
};

export type TtsServiceInputs = InferContractRouterInputs<typeof TtsServiceContract>;
export type TtsServiceOutputs = InferContractRouterOutputs<typeof TtsServiceContract>;
export type TtsServiceWireInputs = InferContractRouterInputs<typeof TtsServiceWireContract>;
export type TtsServiceWireOutputs = InferContractRouterOutputs<typeof TtsServiceWireContract>;
/** TTS has no provider-specific transport context; cancellation remains on the signal. */
export type TtsServiceClientContext = Record<string, never>;
export type ITtsServiceContract = ContractRouterClient<typeof TtsServiceContract, TtsServiceClientContext>;
export type ITtsServiceWireContract = ContractRouterClient<typeof TtsServiceWireContract, TtsServiceClientContext>;
export type TtsServiceCallOptions = NonNullable<Parameters<ITtsServiceContract['synthesize']>[1]>;

function tool(procedure: (typeof TtsServiceWireContract)[keyof typeof TtsServiceWireContract]): ServiceTool {
	const { inputSchema, outputSchema, meta, route } = procedure['~orpc'];
	return {
		title: meta.title,
		description: meta.description ?? route?.description,
		inputSchema: toJsonSchema(inputSchema!) as Record<string, unknown>,
		outputSchema: toJsonSchema(outputSchema!) as Record<string, unknown>,
		annotations: {
			readOnlyHint: meta.readOnlyHint,
			destructiveHint: meta.destructiveHint,
			supportsDryRun: meta.supportsDryRun,
		},
	};
}

/** Compatibility metadata projection for the current provider/catalog boundary. */
export const TtsTools = {
	synthesize: tool(TtsServiceWireContract.synthesize),
	listVoices: tool(TtsServiceWireContract.listVoices),
};

/** Compatibility projection retained for callers of the old ServiceContract metadata shape. */
export const TtsStaticServiceContract = {
	methods: Object.fromEntries(Object.entries(TtsTools).map(([name, item]) => [name, {
		description: item.description,
		inputSchema: item.inputSchema,
		outputSchema: item.outputSchema,
	}])),
} satisfies ServiceContract;
