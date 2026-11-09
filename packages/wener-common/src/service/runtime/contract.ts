import type { z } from 'zod';
import { toJsonSchema } from '../../schema';
import type { ServiceCapability } from '../registry';
import { defineServiceOperation } from './defineServiceOperation';
import type { ServiceCallOptions, ServiceOperation } from './types';

/** MCP-style tool annotations, attached to an oRPC contract procedure via `.meta()`. */
export interface ServiceToolMeta {
	title?: string;
	description?: string;
	readOnlyHint?: boolean;
	destructiveHint?: boolean;
	/** Tool accepts an opt-in `dryRun: true` input flag that previews a write without performing it. */
	supportsDryRun?: boolean;
}

/**
 * The subset of an oRPC contract procedure's internal shape this bridge reads. oRPC does not
 * export this as a public type (the `~orpc` property is intentionally unlisted), so this is a
 * narrow structural type matched against the procedure's actual runtime shape -- see
 * packages/common/src/mcp/createMcpServerHandler.ts for the one other place in this workspace
 * that reads the same `~orpc` internals.
 */
interface ContractProcedureShape<TInput extends z.ZodTypeAny = z.ZodTypeAny, TOutput extends z.ZodTypeAny = z.ZodTypeAny> {
	'~orpc': {
		inputSchema?: TInput;
		outputSchema?: TOutput;
		meta?: ServiceToolMeta;
		route?: { description?: string };
	};
}

/**
 * Derive a local `ServiceOperation` from an oRPC contract-first procedure (`oc.input(...)
 * .output(...).meta(...)`). The contract is the single source of truth for input/output
 * schemas and tool metadata; this just wires it to a local `invoke` function. The input type
 * is inferred from the contract's own zod schema, not passed separately.
 */
export function defineContractOperation<
	S,
	TInput extends z.ZodTypeAny,
	TOutput extends z.ZodTypeAny,
	O = z.infer<TOutput>,
>(definition: {
	capability: ServiceCapability<S>;
	contract: ContractProcedureShape<TInput, TOutput>;
	invoke(service: S, input: z.infer<TInput>, options: ServiceCallOptions): O | Promise<O>;
}): ServiceOperation<S, O> {
	const { capability, contract, invoke } = definition;
	const { inputSchema, outputSchema, meta = {}, route } = contract['~orpc'];
	if (!inputSchema) throw new Error('Contract procedure is missing an input schema');
	return defineServiceOperation({
		capability,
		tool: {
			title: meta.title,
			description: meta.description ?? route?.description,
			inputSchema: toJsonSchema(inputSchema) as Record<string, unknown>,
			outputSchema: outputSchema ? (toJsonSchema(outputSchema) as Record<string, unknown>) : undefined,
			annotations: {
				readOnlyHint: meta.readOnlyHint,
				destructiveHint: meta.destructiveHint,
				supportsDryRun: meta.supportsDryRun,
			},
		},
		input: { safeParse: (value) => inputSchema.safeParse(value) },
		invoke,
	});
}
