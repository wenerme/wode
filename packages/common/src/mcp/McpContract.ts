import {
	CallToolRequestSchema,
	CallToolResultSchema,
	CompleteRequestSchema,
	CompleteResultSchema,
	CreateMessageRequestSchema,
	CreateMessageResultSchema,
	ElicitRequestSchema,
	ElicitResultSchema,
	EmptyResultSchema,
	GetPromptRequestSchema,
	GetPromptResultSchema,
	InitializeRequestSchema,
	InitializeResultSchema,
	ListPromptsRequestSchema,
	ListPromptsResultSchema,
	ListResourcesRequestSchema,
	ListResourcesResultSchema,
	ListResourceTemplatesRequestSchema,
	ListResourceTemplatesResultSchema,
	ListRootsRequestSchema,
	ListRootsResultSchema,
	ListToolsRequestSchema,
	ListToolsResultSchema,
	PingRequestSchema,
	ReadResourceRequestSchema,
	ReadResourceResultSchema,
	SetLevelRequestSchema,
	SubscribeRequestSchema,
	UnsubscribeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { oc } from '@orpc/contract';

export const McpContract = {
	initialize: oc
		.input(InitializeRequestSchema)
		.output(InitializeResultSchema)
		.route({ method: 'POST', path: '/initialize', description: 'Initialize the MCP connection' }),
	ping: oc
		.input(PingRequestSchema)
		.output(EmptyResultSchema)
		.route({ method: 'POST', path: '/ping', description: 'Ping to check connection health' }),

	listResources: oc
		.input(ListResourcesRequestSchema)
		.output(ListResourcesResultSchema)
		.route({ method: 'POST', path: '/resources/list', description: 'List all available resources' }),
	listResourceTemplates: oc
		.input(ListResourceTemplatesRequestSchema)
		.output(ListResourceTemplatesResultSchema)
		.route({ method: 'POST', path: '/resources/templates/list', description: 'List all available resource templates' }),
	readResource: oc
		.input(ReadResourceRequestSchema)
		.output(ReadResourceResultSchema)
		.route({ method: 'POST', path: '/resources/read', description: 'Read a specific resource' }),
	subscribe: oc
		.input(SubscribeRequestSchema)
		.output(EmptyResultSchema)
		.route({ method: 'POST', path: '/resources/subscribe', description: 'Subscribe to resource updates' }),
	unsubscribe: oc
		.input(UnsubscribeRequestSchema)
		.output(EmptyResultSchema)
		.route({ method: 'POST', path: '/resources/unsubscribe', description: 'Unsubscribe from resource updates' }),

	listPrompts: oc
		.input(ListPromptsRequestSchema)
		.output(ListPromptsResultSchema)
		.route({ method: 'POST', path: '/prompts/list', description: 'List all available prompts' }),
	getPrompt: oc
		.input(GetPromptRequestSchema)
		.output(GetPromptResultSchema)
		.route({ method: 'POST', path: '/prompts/get', description: 'Get a specific prompt by name' }),

	listTools: oc
		.input(ListToolsRequestSchema)
		.output(ListToolsResultSchema)
		.route({ method: 'POST', path: '/tools/list', description: 'List all available tools' }),
	callTool: oc
		.input(CallToolRequestSchema)
		.output(CallToolResultSchema)
		.route({ method: 'POST', path: '/tools/call', description: 'Call a specific tool' }),

	setLevel: oc
		.input(SetLevelRequestSchema)
		.output(EmptyResultSchema)
		.route({ method: 'POST', path: '/logging/setLevel', description: 'Set the logging level' }),

	complete: oc
		.input(CompleteRequestSchema)
		.output(CompleteResultSchema)
		.route({ method: 'POST', path: '/completion/complete', description: 'Get autocomplete suggestions' }),

	createMessage: oc
		.input(CreateMessageRequestSchema)
		.output(CreateMessageResultSchema)
		.route({ method: 'POST', path: '/sampling/createMessage', description: 'Request to create a message (sampling)' }),
	elicit: oc
		.input(ElicitRequestSchema)
		.output(ElicitResultSchema)
		.route({ method: 'POST', path: '/elicit', description: 'Elicit user input with structured schema' }),
	listRoots: oc
		.input(ListRootsRequestSchema)
		.output(ListRootsResultSchema)
		.route({ method: 'POST', path: '/roots/list', description: 'List root directories' }),
} as const;
