import { formatJsonSchemaTypeScriptExpression } from 'common/utils';
import type { CliCatalogProvider } from './types';

function typeName(name: string): string {
	if (name === 'openobserve') return 'OpenObserve';
	const normalized = name.replace(/(^|[^A-Za-z0-9$])([A-Za-z0-9$])/gu, (_match, _prefix, letter: string) => letter.toUpperCase())
		.replace(/[^A-Za-z0-9_$]/gu, '');
	return /^[A-Za-z_$]/u.test(normalized) ? normalized : `Provider${normalized}`;
}

function methodName(name: string): string {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(name) ? name : JSON.stringify(name);
}

function comment(value: string): string {
	return value.replace(/\*\//gu, '* /').replace(/[\r\n\u2028\u2029]/gu, ' ');
}

/** Static provider options and service contracts only; no CLI input/output types are invented. */
export function formatServiceProviderTypeScript(provider: CliCatalogProvider): string {
	const name = typeName(provider.name);
	const sections: string[] = [];
	const schema = provider.optionsSchema;
	if (schema) {
		const optionsName = `${name}ServiceOptions`;
		sections.push(`export type ${optionsName} = ${formatJsonSchemaTypeScriptExpression(schema)};`);
	}
	const tools = (provider as CliCatalogProvider).tools;
	const methods = provider.contract?.methods ?? tools;
	if (methods) {
		const declarations = Object.entries(methods).map(([method, contract]) => {
			const input = ('inputType' in contract && typeof contract.inputType === 'string' ? contract.inputType : undefined)
				?? (contract.inputSchema ? formatJsonSchemaTypeScriptExpression(contract.inputSchema) : 'void');
			const output = ('outputType' in contract && typeof contract.outputType === 'string' ? contract.outputType : undefined)
				?? (contract.outputSchema ? formatJsonSchemaTypeScriptExpression(contract.outputSchema) : 'unknown');
			return `${contract.description ? `  /** ${comment(contract.description)} */\n` : ''}  ${methodName(method)}(input: ${input}): Promise<${output}>;`;
		});
		sections.push(`export interface ${name}Service {\n${declarations.join('\n')}\n}`);
	}
	// An absent static contract (e.g. HTTP discovery) contributes no fabricated service methods.
	return sections.join('\n\n');
}
