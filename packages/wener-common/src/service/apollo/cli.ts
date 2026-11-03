import type { IApolloService } from './core/interface';
import { redactApolloValue } from './core/redactor';
import { ApolloToolInputs, ApolloWriteOperations } from '../runtime/apollo-tools';
import { type ServiceCliDefinition, type ServiceCliOperation, serviceCliString } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';

type Operation = keyof typeof ApolloToolInputs;
const paths: Partial<Record<Operation, string>> = {
	readConfig: 'read', getStatus: 'status',
	listPortalApp: 'portal apps', listPortalOrganization: 'portal organizations', listPortalEnv: 'portal environments',
	getPortalNavTree: 'portal tree', listPortalNamespace: 'portal namespaces', getPortalNamespace: 'portal namespace',
	listPortalItem: 'portal items', listPortalRelease: 'portal releases', getPortalConfig: 'portal config',
	listRelease: 'release list', getRelease: 'release get', diffRelease: 'release diff',
	diffNamespaceRelease: 'release pending', publishNamespaceRelease: 'release publish', rollbackRelease: 'release rollback',
	patchNamespaceDocument: 'namespace patch', writeNamespaceText: 'namespace write', patchNamespaceItem: 'item patch',
};

function command(operation: Operation): ServiceCliOperation<IApolloService> {
	const path = paths[operation] ?? `admin ${operation.replace(/([a-z])([A-Z])/gu, '$1-$2').toLowerCase()}`;
	const [first, second] = path.split(' ');
	const mutating = ApolloWriteOperations.has(operation);
	return {
		...(second ? { group: first, name: second } : { name: first }),
		description: `Apollo ${operation.replace(/([a-z])([A-Z])/gu, '$1 $2').toLowerCase()}`,
		mutating,
		options: [
			{ name: 'input', description: 'Operation input as JSON, @file or - for stdin' },
			...(operation === 'readConfig' ? [{ name: 'read-format', description: 'auto | config | json | properties | raw | content | data' }] : []),
			...(mutating ? [
				{ name: 'yes', type: 'boolean' as const, description: 'Confirm this write operation' },
				{ name: 'dry-run', type: 'boolean' as const, description: 'Preview supported operations without modifying Apollo' },
			] : []),
		],
		async prepare(context) {
			if (mutating && context.options.yes !== true) throw new ServiceCliInputError('Apollo write operations require --yes');
			let input: Record<string, unknown> = {};
			const source = serviceCliString(context.options, 'input');
			if (source !== undefined) {
				try {
					const raw = source.startsWith('@') || source === '-'
						? await context.readText(source, { label: 'Apollo input', maxBytes: 1024 * 1024 }) : source;
					const parsed: unknown = JSON.parse(raw);
					if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
					input = parsed as Record<string, unknown>;
				} catch { throw new ServiceCliInputError('Invalid Apollo input JSON'); }
			}
			for (const key of ['namespace', 'cluster', 'env', 'operator']) {
				const value = serviceCliString(context.options, key);
				if (value !== undefined) input[key] = value;
			}
			const appId = serviceCliString(context.options, 'app-id');
			if (appId !== undefined) input.appId = appId;
			const format = serviceCliString(context.options, 'read-format');
			if (format !== undefined) input.format = format;
			if (context.options['dry-run'] === true) {
				const properties = ApolloToolInputs[operation].shape;
				if (!Object.hasOwn(properties, 'dryRun')) throw new ServiceCliInputError('This Apollo operation does not support --dry-run');
				input.dryRun = true;
			}
			const parsed = ApolloToolInputs[operation].safeParse(input);
			if (!parsed.success) throw new ServiceCliInputError('Invalid Apollo operation input; inspect its service schema');
			return async (service) => {
				const invoke = service[operation] as (input: unknown) => Promise<unknown>;
				return redactApolloValue(await invoke.call(service, parsed.data));
			};
		},
	};
}

export const ApolloCliDefinition: ServiceCliDefinition<IApolloService> = {
	name: 'apollo',
	description: 'Manage Apollo Config, Portal and Admin services',
	options: [
		{ name: 'namespace', description: 'Apollo namespace' }, { name: 'cluster', description: 'Apollo cluster' },
		{ name: 'app-id', description: 'Apollo application ID' }, { name: 'env', description: 'Apollo environment' },
		{ name: 'operator', description: 'Apollo OpenAPI operator' },
	],
	commands: (Object.keys(ApolloToolInputs) as Operation[]).map(command),
};
