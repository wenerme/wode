import { z } from 'zod';

const ExtensionsSchema = z.record(z.string(), z.json());

export const LorebookEntrySchema = z.strictObject({
	id: z.string().min(1),
	name: z.string().optional(),
	keys: z.array(z.string().min(1)).default([]),
	secondaryKeys: z.array(z.string().min(1)).optional(),
	content: z.string(),
	enabled: z.boolean().optional(),
	constant: z.boolean().optional(),
	selective: z.boolean().optional(),
	caseSensitive: z.boolean().optional(),
	useRegex: z.boolean().optional(),
	priority: z.number().int().optional(),
	insertionOrder: z.number().int().optional(),
	position: z.string().optional(),
	depth: z.number().int().nonnegative().optional(),
	role: z.string().optional(),
	tags: z.array(z.string().min(1)).optional(),
	extensions: ExtensionsSchema.optional(),
});
export type LorebookEntry = z.infer<typeof LorebookEntrySchema>;

export const LorebookBindingSchema = z.strictObject({
	lorebookId: z.string().min(1),
	version: z.string().min(1).optional(),
	entryIds: z.array(z.string().min(1)).optional(),
	required: z.boolean().optional(),
	enabled: z.boolean().optional(),
	extensions: ExtensionsSchema.optional(),
});
export type LorebookBinding = z.infer<typeof LorebookBindingSchema>;

export const PersonaLorebookSchema = z
	.strictObject({
		name: z.string().optional(),
		description: z.string().optional(),
		entries: z.array(LorebookEntrySchema).default([]),
		bindings: z.array(LorebookBindingSchema).default([]),
		scanDepth: z.number().int().positive().optional(),
		tokenBudget: z.number().int().positive().optional(),
		recursive: z.boolean().optional(),
		extensions: ExtensionsSchema.optional(),
	})
	.superRefine((value, context) => {
		const entryIds = new Set<string>();
		for (const [index, entry] of value.entries.entries()) {
			if (entryIds.has(entry.id)) {
				context.addIssue({
					code: 'custom',
					message: `duplicate lorebook entry identity ${entry.id}`,
					path: ['entries', index, 'id'],
				});
			} else {
				entryIds.add(entry.id);
			}
		}
	});
export type PersonaLorebook = z.infer<typeof PersonaLorebookSchema>;
