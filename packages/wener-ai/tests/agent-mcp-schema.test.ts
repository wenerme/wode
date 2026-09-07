import { LorebookEntrySchema, PersonaSchema } from '@wener/ai/agent/persona';
import { getSkillIdentity, SkillSchema } from '@wener/ai/agent/skill';
import {
	defineMcpServer,
	McpServerConfigCompatibilityInputSchema,
	McpServerConfigSchema,
	McpTransportSchema,
	normalizeMcpServerConfig,
} from '@wener/ai/mcp';
import { describe, expect, test } from 'vite-plus/test';

const persona = {
	id: 'persona-example',
	name: 'Example Guide',
	version: '1.0.0',
	description: 'A neutral example persona.',
	author: { name: 'Example Author', url: 'https://example.test/author' },
	authoring: {
		background: 'Created for schema verification.',
		personality: 'Direct and precise.',
		values: ['clarity'],
		goals: ['help with examples'],
		flaws: ['limited context'],
		behaviorPolicy: 'State uncertainty.',
		speechStyle: 'Concise.',
		exampleDialogue: ['User: Hello\nGuide: Hello.'],
	},
	prompts: {
		system: 'Act as an example guide.',
		persona: 'You are {{char}}.',
		scenario: '{{user}} requests a worked example.',
		postHistoryInstructions: 'Keep the answer bounded.',
		examples: ['Example exchange'],
	},
	greetings: ['Hello, {{user}}.'],
	groupGreetings: ['Hello, everyone.'],
	lorebook: {
		entries: [
			{
				id: 'entry-example',
				keys: ['example'],
				content: 'Example facts are fictional.',
				enabled: true,
				priority: 10,
				extensions: { activation: 'keyword' },
			},
		],
		bindings: [{ lorebookId: 'shared-example', version: '1', required: false }],
	},
	assets: [
		{
			id: 'avatar-example',
			type: 'avatar',
			uri: 'https://assets.example.test/avatar.png',
			mediaType: 'image/png',
			checksum: 'sha256:example',
			rights: { license: 'CC0-1.0', redistributable: true },
		},
	],
	governance: {
		visibility: 'public',
		contentRating: 'general',
		reviewStatus: 'approved',
		provenance: 'Authored as a synthetic example.',
	},
	rights: {
		license: 'CC0-1.0',
		rightsHolder: 'Example Author',
		redistributable: true,
		commercialUse: true,
		derivativeWorks: true,
	},
	metadata: { category: 'example' },
	extensions: { 'example.dev/persona': true },
};

describe('Persona schema', () => {
	test('round-trips authoring, lorebook, assets, governance, and rights', () => {
		const parsed = PersonaSchema.parse(JSON.parse(JSON.stringify(persona)));
		expect(parsed).toEqual(persona);
		expect(LorebookEntrySchema.parse(persona.lorebook.entries[0]).content).toContain('fictional');
	});

	test.each([
		'crawlState',
		'queryRevision',
		'rawArchive',
		'archiveBytes',
		'catalogSnapshot',
	])('rejects crawler/archive field %s', (field) => {
		expect(PersonaSchema.safeParse({ ...persona, [field]: 'forbidden' }).success).toBe(false);
	});

	test('rejects raw bytes in asset manifests and explicit metadata', () => {
		const invalidAsset = structuredClone(persona);
		(invalidAsset.assets[0] as (typeof invalidAsset.assets)[0] & { bytes?: Uint8Array }).bytes = new Uint8Array([
			1, 2, 3,
		]);
		expect(PersonaSchema.safeParse(invalidAsset).success).toBe(false);
		expect(PersonaSchema.safeParse({ ...persona, metadata: { rawArchive: new Uint8Array([1, 2, 3]) } }).success).toBe(
			false,
		);
	});

	test('requires unique lorebook entry and asset identities', () => {
		const duplicateLorebook = structuredClone(persona);
		duplicateLorebook.lorebook.entries.push(structuredClone(duplicateLorebook.lorebook.entries[0]));
		expect(PersonaSchema.safeParse(duplicateLorebook).success).toBe(false);

		const duplicateAssets = structuredClone(persona);
		duplicateAssets.assets.push(structuredClone(duplicateAssets.assets[0]));
		expect(PersonaSchema.safeParse(duplicateAssets).success).toBe(false);
	});
});

describe('Skill schema', () => {
	const skill = {
		id: 'skill-example',
		name: 'example-skill',
		description: 'Use for deterministic examples.',
		instructions: 'Read the referenced contract, then execute the bounded check.',
		version: '1.0.0',
		tags: ['example', 'verification'],
		toolRequirements: [
			{
				name: 'read',
				required: true,
				capabilities: ['text-file'],
				configuration: { maxBytes: 1024 },
			},
		],
		contextRequirements: [
			{ kind: 'agents', value: 'AGENTS.md', required: true },
			{ kind: 'directory', value: 'references', required: false },
		],
		resources: [
			{
				id: 'contract',
				type: 'reference',
				path: 'references/contract.md',
				mediaType: 'text/markdown',
			},
		],
		metadata: { owner: 'example' },
		extensions: { 'example.dev/skill': true },
	};

	test('round-trips parsed skill authoring contracts', () => {
		expect(SkillSchema.parse(JSON.parse(JSON.stringify(skill)))).toEqual(skill);
	});

	test('requires resource location and rejects filesystem parser state', () => {
		expect(SkillSchema.safeParse({ ...skill, resources: [{ id: 'missing', type: 'reference' }] }).success).toBe(false);
		expect(SkillSchema.safeParse({ ...skill, discoveredFiles: ['SKILL.md'] }).success).toBe(false);
	});

	test('requires unique resource identities', () => {
		expect(
			SkillSchema.safeParse({
				...skill,
				resources: [skill.resources[0], structuredClone(skill.resources[0])],
			}).success,
		).toBe(false);
	});

	test('uses id or name plus version as canonical identity', () => {
		expect(getSkillIdentity({ id: 'skill-id', name: 'review', version: '1' })).toBe(
			getSkillIdentity({ id: 'skill-id', name: 'renamed', version: '2' }),
		);
		expect(getSkillIdentity({ name: 'review', version: '1' })).not.toBe(
			getSkillIdentity({ name: 'review', version: '2' }),
		);
	});
});

describe('MCP server configuration', () => {
	test('normalizes compatibility fields with canonical precedence and no duplicate keys', () => {
		const parsed = normalizeMcpServerConfig({
			name: 'example-http',
			transport: 'streamable-http',
			type: 'http',
			url: 'https://canonical-mcp.example.test/mcp',
			serverUrl: 'https://legacy-mcp.example.test/mcp',
			headers: { Authorization: 'Bearer plain-example-token' },
			enabled: false,
			disabled: true,
			options: { retry: 1 },
		});
		expect(parsed).toMatchObject({
			name: 'example-http',
			transport: 'streamable-http',
			url: 'https://canonical-mcp.example.test/mcp',
			enabled: false,
		});
		expect(McpServerConfigCompatibilityInputSchema).not.toBe(McpServerConfigSchema);
		for (const key of ['type', 'serverUrl', 'disabled']) expect(parsed).not.toHaveProperty(key);
	});

	test('supports SSE and stdio with plaintext headers/env', () => {
		expect(
			McpServerConfigSchema.parse({
				transport: 'sse',
				url: 'https://mcp.example.test/sse',
				headers: { 'X-Example-Key': 'plain-header' },
			}),
		).toMatchObject({ transport: 'sse', enabled: true });
		expect(
			McpServerConfigSchema.parse({
				transport: 'stdio',
				command: 'example-mcp',
				args: ['--stdio'],
				env: { EXAMPLE_KEY: 'plain-env' },
				cwd: '/workspace',
			}),
		).toMatchObject({ transport: 'stdio', command: 'example-mcp', enabled: true });
		expect(
			normalizeMcpServerConfig({ type: 'http', serverUrl: 'https://mcp.example.test', disabled: true }),
		).toMatchObject({ transport: 'streamable-http', enabled: false });
	});

	test('keeps canonical transports strict and alias-free', () => {
		expect(McpServerConfigSchema.safeParse({ transport: 'sse' }).success).toBe(false);
		expect(
			McpServerConfigSchema.safeParse({ transport: 'stdio', command: 'example-mcp', url: 'https://example.test' })
				.success,
		).toBe(false);
		expect(McpServerConfigSchema.safeParse({ type: 'http', serverUrl: 'https://mcp.example.test' }).success).toBe(
			false,
		);
	});

	test('compatibility input rejects conflicts and every cross-transport field without throwing', () => {
		const invalid = [
			{
				transport: 'streamable-http',
				url: 'https://mcp.example.test',
				command: 'example-mcp',
				args: ['--stdio'],
				env: { EXAMPLE_KEY: 'plain-env' },
				cwd: '/workspace',
			},
			{
				transport: 'stdio',
				command: 'example-mcp',
				url: 'https://mcp.example.test',
				headers: { Authorization: 'Bearer plain-example-token' },
			},
			{
				transport: 'stdio',
				type: 'http',
				command: 'example-mcp',
				enabled: true,
				disabled: true,
			},
		] as const;
		for (const input of invalid) {
			let result: ReturnType<typeof McpServerConfigCompatibilityInputSchema.safeParse> | undefined;
			expect(() => {
				result = McpServerConfigCompatibilityInputSchema.safeParse(input);
			}).not.toThrow();
			expect(result?.success).toBe(false);
		}
	});

	test('keeps existing McpServerDef exports intact', () => {
		const definition = defineMcpServer({
			name: 'example',
			title: 'Example',
			description: 'Example server definition.',
			version: '1.0.0',
			validateOptions: () => ({ valid: true }),
			getCacheKey: () => 'example',
			create: () => ({ server: {} as never, close: async () => undefined }),
		});
		expect(definition.tags).toEqual([]);
		expect(definition.metadata).toEqual({});
		expect(McpTransportSchema.options).toEqual(['streamable-http', 'sse', 'stdio']);
	});
});
