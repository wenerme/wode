/** JSON Schema for the exported catalog document, not native configuration or service instances. */
export const CliCatalogJsonSchema = {
	$schema: 'https://json-schema.org/draft/2020-12/schema',
	$id: 'https://wener.me/schemas/woctl/catalog/v1',
	title: 'woctl static catalog v1',
	type: 'object',
	additionalProperties: false,
	required: ['schemaVersion', 'name', 'version', 'globalOptions', 'commands', 'providers'],
	properties: {
		schemaVersion: { const: 1 },
		name: { type: 'string' },
		version: { type: 'string' },
		globalOptions: { type: 'array', items: { $ref: '#/$defs/option' } },
		commands: { type: 'array', items: { $ref: '#/$defs/command' } },
		providers: { type: 'array', items: { $ref: '#/$defs/provider' } },
	},
	$defs: {
		strings: { type: 'array', items: { type: 'string' } },
		examples: {
			type: 'array', items: { type: 'object', additionalProperties: false, required: ['command'], properties: { command: { type: 'string' }, description: { type: 'string' } } },
		},
		jsonSchema: { type: 'object', additionalProperties: true },
		option: {
			type: 'object', additionalProperties: false, required: ['name', 'description'],
			properties: {
				name: { type: 'string' }, aliases: { $ref: '#/$defs/strings' }, description: { type: 'string' },
				helpScope: { enum: ['root', 'all'] }, type: { enum: ['string', 'boolean'] },
				repeatable: { type: 'boolean' }, variadic: { type: 'boolean' }, negatable: { type: 'boolean' },
				default: { anyOf: [{ type: 'string' }, { type: 'boolean' }] },
			},
		},
		availability: {
			type: 'object', additionalProperties: false,
			properties: { serviceProvider: { type: 'string' }, serviceCapability: { type: 'string' }, hostCapability: { type: 'string' } },
		},
		command: {
			type: 'object', additionalProperties: false, required: ['name', 'description'],
			properties: {
				name: { type: 'string' }, description: { type: 'string' }, aliases: { $ref: '#/$defs/strings' },
				output: { enum: ['standard', 'custom'] }, hidden: { type: 'boolean' }, raw: { type: 'boolean' },
				summary: { $ref: '#/$defs/strings' }, arguments: { type: 'string' }, usage: { type: 'string' },
				examples: { $ref: '#/$defs/examples' }, availability: { $ref: '#/$defs/availability' },
				options: { type: 'array', items: { $ref: '#/$defs/option' } },
				commands: { type: 'array', items: { $ref: '#/$defs/command' } },
			},
		},
		method: {
			type: 'object', additionalProperties: false,
			properties: {
				description: { type: 'string' }, inputType: { type: 'string' }, outputType: { type: 'string' },
				inputSchema: { $ref: '#/$defs/jsonSchema' }, outputSchema: { $ref: '#/$defs/jsonSchema' },
			},
		},
		tool: {
			type: 'object', additionalProperties: false, required: ['inputSchema'],
			properties: {
				title: { type: 'string' }, description: { type: 'string' },
				inputSchema: { $ref: '#/$defs/jsonSchema' }, outputSchema: { $ref: '#/$defs/jsonSchema' },
				annotations: {
					type: 'object', additionalProperties: false,
					properties: { readOnlyHint: { type: 'boolean' }, destructiveHint: { type: 'boolean' }, supportsDryRun: { type: 'boolean' } },
				},
			},
		},
		provider: {
			type: 'object', additionalProperties: false, required: ['name'],
			properties: {
				name: { type: 'string' }, aliases: { $ref: '#/$defs/strings' }, capabilities: { $ref: '#/$defs/strings' },
				title: { type: 'string' }, description: { type: 'string' }, documentationUrl: { type: 'string' },
				examples: { $ref: '#/$defs/examples' }, optionsSchema: { $ref: '#/$defs/jsonSchema' },
				contract: {
					type: 'object', additionalProperties: false, required: ['methods'],
					properties: { methods: { type: 'object', additionalProperties: { $ref: '#/$defs/method' } } },
				},
				tools: { type: 'object', additionalProperties: { $ref: '#/$defs/tool' } },
			},
		},
	},
} as const;
