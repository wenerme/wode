import { vi } from 'vitest';
import { Cli, type CliContext } from '../../../cli/Cli';
import { createServiceCliCommand } from '../../cli/createServiceCliCommand';
import type { ServiceCliOperation, ServiceCliOptions } from '../../cli/ServiceCliDefinition';
import type { LinearServiceClient } from '../client';
import { LinearCliDefinition } from './commands';

export const linearToolNames = [
	'getViewer',
	'listTeam',
	'listIssueState',
	'listUser',
	'listProject',
	'listIssue',
	'getIssue',
	'createIssue',
	'updateIssue',
	'listComment',
	'createComment',
] as const;

export function createLinearClientFixture() {
	const method = () => vi.fn(async () => ({}) as never);
	return {
		getViewer: method(),
		listTeam: method(),
		listIssueState: method(),
		listUser: method(),
		listProject: method(),
		listIssue: method(),
		getIssue: method(),
		createIssue: method(),
		updateIssue: method(),
		listComment: method(),
		createComment: method(),
	} satisfies LinearServiceClient;
}

export function linearOperation(name: string): ServiceCliOperation<LinearServiceClient> {
	const found = LinearCliDefinition.commands.find(
		(item) => `${'group' in item ? `${item.group} ` : ''}${item.name}` === name,
	);
	if (!found) throw new Error(`Missing operation: ${name}`);
	return found;
}

/** A virtual host: no config, filesystem, environment, or backend access. */
export function createLinearCliFixture(
	options: { readOnly?: boolean; files?: Record<string, string | Uint8Array> } = {},
) {
	const readOnly = options.readOnly === true;
	const client = createLinearClientFixture();
	const createClient = vi.fn(() => client);
	const readText = vi.fn(
		async (value: string, _context: CliContext, limits?: { label?: string; maxBytes?: number }) => {
			const content = value.startsWith('@') ? options.files?.[value.slice(1)] : value;
			if (content === undefined) throw new Error('Fixture file unavailable');
			const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
			if (limits?.maxBytes !== undefined && bytes.byteLength > limits.maxBytes) {
				throw new Error(`${limits.label} exceeds ${limits.maxBytes} bytes`);
			}
			try {
				return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
			} catch {
				throw new Error('Fixture input must contain valid UTF-8');
			}
		},
	);
	const emit =
		vi.fn<(result: unknown, options: ServiceCliOptions, operation: ServiceCliOperation<LinearServiceClient>) => void>();
	const root = vi.fn(async (_options: ServiceCliOptions, context: CliContext, help: string) => {
		context.stdout(help);
	});
	const cli = new Cli('test');
	cli.add(
		createServiceCliCommand(LinearCliDefinition, {
			options: [
				{ name: 'context', description: 'Fixture context' },
				{ name: 'service', description: 'Fixture service' },
				{ name: 'list-services', description: 'Fixture candidates', type: 'boolean' },
			],
			readText,
			root,
			async run(operation, options, context: CliContext, prepare) {
				if (operation.mutating && options.yes !== true) {
					// Confirmation also remains enforced by the definition when used directly.
					throw new Error('Linear mutation requires --yes');
				}
				if (operation.mutating && readOnly) throw new Error('Linear service is read-only');
				const invoke = await prepare();
				emit(await invoke(createClient(), { signal: context.signal }), options, operation);
			},
		}),
	);
	const context: CliContext = { stdout: vi.fn(), stderr: vi.fn(), signal: new AbortController().signal };
	return { cli, client, context, readText, createClient, emit, root };
}
