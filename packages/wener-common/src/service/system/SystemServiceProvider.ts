import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import { type ISystemService, SystemServiceCapability } from './ISystemService';
import { SystemOperations } from './operations';
import { SystemEchoInputSchema } from './SystemServiceContract';

export const SystemServiceOptionsSchema = z.strictObject({});

/** Host-supplied runtime information; `application` and `version` identify the host app. */
export type SystemHostInfo = { application: string; version: string } & Record<string, unknown>;

export function createSystemService(info: SystemHostInfo): ISystemService {
	return {
		type: 'system',
		readOnly: true,
		async info() {
			return { ...info };
		},
		async echo(input) {
			const parsed = SystemEchoInputSchema.safeParse(input);
			if (!parsed.success) throw new Error('system echo requires a text string');
			return { text: parsed.data.text };
		},
	};
}

/** Offline `system` provider; the host injects application identity and runtime info. */
export function createSystemServiceProvider(info: SystemHostInfo): ServiceProviderDefinition<ISystemService> {
	return {
		name: 'system',
		title: 'System',
		description: 'Offline runtime information and echo operations',
		provides: [SystemServiceCapability],
		optionsSchema: SystemServiceOptionsSchema,
		operations: SystemOperations,
		create() {
			return { system: createSystemService(info) };
		},
	};
}
