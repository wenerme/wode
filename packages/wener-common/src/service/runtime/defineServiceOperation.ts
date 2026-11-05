import type { ServiceCapability, ServiceTypeMap } from '../registry';
import type { ServiceCallOptions, ServiceInputValidator, ServiceOperation, ServiceTool } from './types';

/** Capture the typed invocation once; dispatch never indexes a service dynamically. */
export function defineServiceOperation<C extends ServiceCapability, I, O>(definition: {
	capability: C;
	tool: ServiceTool;
	input: ServiceInputValidator<I>;
	invoke(service: ServiceTypeMap[C], input: I, options: ServiceCallOptions): O | Promise<O>;
}): ServiceOperation<C, O> {
	const { capability, input: validator, invoke } = definition;
	return {
		capability,
		tool: definition.tool,
		input: validator,
		async execute(registry, name, input, options = {}) {
			options.signal?.throwIfAborted();
			const parsed = validator.safeParse(input);
			if (!parsed.success) throw new TypeError('Invalid service input');
			options.signal?.throwIfAborted();
			const service = await registry.load(capability, name);
			options.signal?.throwIfAborted();
			return invoke(service, parsed.data, options);
		},
	};
}
