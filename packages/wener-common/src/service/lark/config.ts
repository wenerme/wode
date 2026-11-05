import { z } from 'zod';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);

export const LarkServiceOptionsSchema = Object.assign(
	z
		.strictObject({
			appIdEnv: envName.optional(),
			appSecretEnv: envName.optional(),
			webhookUrlEnv: envName.optional(),
			webhookSecretEnv: envName.optional(),
			timeoutMs: z.number().int().min(1).max(3_600_000).optional(),
		})
		.superRefine((value, ctx) => {
			if ((value.appIdEnv === undefined) !== (value.appSecretEnv === undefined)) {
				ctx.addIssue({ code: 'custom', message: 'appIdEnv and appSecretEnv must be configured together' });
			}
			if (value.appIdEnv === undefined && value.webhookUrlEnv === undefined) {
				ctx.addIssue({ code: 'custom', message: 'Lark service requires appIdEnv+appSecretEnv or webhookUrlEnv' });
			}
		}),
	{
		jsonSchema: {
			type: 'object',
			properties: {
				appIdEnv: { type: 'string' },
				appSecretEnv: { type: 'string' },
				webhookUrlEnv: { type: 'string' },
				webhookSecretEnv: { type: 'string' },
				timeoutMs: { type: 'integer', minimum: 1 },
			},
			additionalProperties: false,
		},
	},
);
export type LarkServiceOptions = z.infer<typeof LarkServiceOptionsSchema>;
