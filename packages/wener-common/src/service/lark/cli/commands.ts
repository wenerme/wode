import { type ServiceCliDefinition, serviceCliString } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { ILarkService } from '../ILarkService';
import { sanitizeLarkOutput } from '../sanitize';

function requireYes(options: Record<string, unknown>, message: string): void {
	if (options.yes !== true) throw new ServiceCliInputError(message);
}

function larkApiMethod(options: { method?: string; body?: string }): string {
	const method = (options.method ?? (options.body === undefined ? 'GET' : 'POST')).trim().toUpperCase();
	if (!['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
		throw new ServiceCliInputError('--method must be GET, HEAD, OPTIONS, POST, PUT, PATCH or DELETE');
	}
	return method;
}

export const LarkCliDefinition: ServiceCliDefinition<ILarkService> = {
	name: 'lark',
	aliases: ['feishu'],
	description: 'Send Lark/Feishu messages and call the Feishu OpenAPI',
	examples: [
		{ command: 'woctl lark send --to ou_xxx --text "hello" --yes', description: 'Send a message via app credential.' },
		{ command: 'woctl lark webhook --text "hello" --yes', description: 'Send a message to the configured group webhook.' },
	],
	options: [],
	commands: [
		{
			name: 'send',
			description: 'Send a Lark/Feishu message via app credential; requires --yes and a writable service',
			examples: [{ command: 'woctl lark send --to ou_xxx --text "hello" --yes' }],
			options: [
				{ name: 'to', description: 'Target open_id / user_id / chat_id / email' },
				{ name: 'text', description: 'Message text, @file or - for stdin' },
				{ name: 'yes', description: 'Confirm sending the message', type: 'boolean' },
			],
			mutating: true,
			async prepare(context) {
				const to = serviceCliString(context.options, 'to');
				if (!to) throw new ServiceCliInputError('--to is required');
				const textArgument = serviceCliString(context.options, 'text');
				if (!textArgument) throw new ServiceCliInputError('--text is required');
				requireYes(context.options, 'Lark send requires --yes');
				const text = (await context.readText(textArgument, { label: 'Lark message text', maxBytes: 64 * 1024 })).trim();
				if (!text) throw new ServiceCliInputError('Lark message text is required');
				const input = { to, text };
				return async (service, callOptions) => sanitizeLarkOutput(await service.sendMessage(input));
			},
		},
		{
			name: 'webhook',
			description:
				'Send a message to a Lark/Feishu group custom bot webhook configured on the service; requires --yes and a writable service',
			examples: [{ command: 'woctl lark webhook --text "hello" --yes' }],
			options: [
				{ name: 'text', description: 'Plain text message, @file or - for stdin' },
				{ name: 'markdown', description: 'Markdown card message, @file or - for stdin' },
				{ name: 'yes', description: 'Confirm sending the message', type: 'boolean' },
			],
			mutating: true,
			async prepare(context) {
				const textArgument = serviceCliString(context.options, 'text');
				const markdownArgument = serviceCliString(context.options, 'markdown');
				if (!textArgument && !markdownArgument) throw new ServiceCliInputError('--text or --markdown is required');
				if (textArgument && markdownArgument) throw new ServiceCliInputError('--text and --markdown cannot be combined');
				requireYes(context.options, 'Lark webhook requires --yes');
				const text = textArgument
					? (await context.readText(textArgument, { label: 'Lark webhook text', maxBytes: 64 * 1024 })).trim()
					: undefined;
				const markdown = markdownArgument
					? (await context.readText(markdownArgument, { label: 'Lark webhook markdown', maxBytes: 64 * 1024 })).trim()
					: undefined;
				if ((text !== undefined && !text) || (markdown !== undefined && !markdown)) {
					throw new ServiceCliInputError('Lark webhook content must not be empty');
				}
				const input = { text, markdown };
				return async (service, callOptions) => sanitizeLarkOutput(await service.sendWebhook(input));
			},
		},
		{
			name: 'api',
			argument: 'path',
			description: 'Call the Feishu OpenAPI; requires --yes and a writable service',
			options: [
				{ name: 'method', aliases: ['X'], description: 'HTTP method; GET by default, POST with --body' },
				{ name: 'body', description: 'JSON body, @file or - for stdin' },
				{ name: 'yes', description: 'Confirm a write request', type: 'boolean' },
			],
			mutating: true,
			async prepare(context) {
				const path = context.args[0];
				if (!path) throw new ServiceCliInputError('Lark API path is required');
				const bodyArgument = serviceCliString(context.options, 'body');
				const method = larkApiMethod({ method: serviceCliString(context.options, 'method'), body: bodyArgument });
				requireYes(context.options, 'Lark API write requires --yes');
				let body: unknown;
				if (bodyArgument !== undefined) {
					const text = await context.readText(bodyArgument, { label: 'Lark API body', maxBytes: 1024 * 1024 });
					try {
						body = JSON.parse(text);
					} catch {
						throw new ServiceCliInputError('--body must contain valid JSON');
					}
				}
				const input = { path, method, ...(body === undefined ? {} : { body }) };
				return async (service, callOptions) => sanitizeLarkOutput(await service.request(input));
			},
		},
	],
};
