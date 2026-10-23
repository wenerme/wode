import { type ServiceCliDefinition, type ServiceCliOption, serviceCliString } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import { isReadOnlySQL } from '../readonly';
import type { ISqlService, SQLExecutionResult, SQLListObjectInput, SQLObject, SQLObjectDescription } from '../types';
import { parseSQLInteger, prepareSQLStatement } from './prepareStatement';

const queryOptions = [
	{ name: 'params', description: 'Bound parameters as a JSON array or @file' },
	{ name: 'var', description: 'Bind a positional parameter: 1=value', repeatable: true },
	{ name: 'limit', description: 'Positive row limit' },
	{ name: 'offset', description: 'Non-negative row offset' },
] as const satisfies readonly ServiceCliOption[];
const tableOptions = [
	{ name: 'schema', description: 'SQL schema/database' },
	{ name: 'search', description: 'Search table names' },
	{ name: 'limit', description: 'Positive row limit' },
	{ name: 'offset', description: 'Non-negative row offset' },
] as const satisfies readonly ServiceCliOption[];

function sqlExecutionTable(value: unknown) {
	const result = value as SQLExecutionResult;
	return { headers: result.columns, rows: result.rows.map((row) => result.columns.map((column) => row[column])) };
}
function sqlObjectTable(value: unknown) {
	return {
		headers: ['schema', 'name', 'type'],
		rows: (value as SQLObject[]).map((row) => [row.schema, row.name, row.type]),
	};
}
function sqlDescriptionTable(value: unknown) {
	const description = value as SQLObjectDescription;
	return {
		headers: ['name', 'type', 'nullable', 'default'],
		rows: (description.children ?? []).map((column) => [
			column.name,
			column.attributes?.dataType ?? column.type,
			column.attributes?.nullable,
			column.attributes?.defaultValue,
		]),
	};
}
function listInput(options: Parameters<typeof serviceCliString>[0]): SQLListObjectInput {
	const schema = serviceCliString(options, 'schema');
	return {
		parent: schema ? { schema, name: schema, type: 'schema' } : undefined,
		search: serviceCliString(options, 'search'),
		limit: parseSQLInteger(serviceCliString(options, 'limit'), 'limit'),
		offset: parseSQLInteger(serviceCliString(options, 'offset'), 'offset'),
	};
}

export const SQLCliDefinition: ServiceCliDefinition<ISqlService> = {
	name: 'sql',
	description: 'SQL service operations',
	commands: [
		{
			name: 'query',
			aliases: ['q'],
			description: 'Run a read-only SQL query',
			argument: 'statement',
			variadic: true,
			options: queryOptions,
			table: sqlExecutionTable,
			async prepare(context) {
				const input = await prepareSQLStatement(context);
				return (service, options) => service.query(input, options);
			},
		},
		{
			name: 'exec',
			description: 'Execute SQL with explicit confirmation',
			argument: 'statement',
			variadic: true,
			mutating: true,
			options: [...queryOptions, { name: 'yes', type: 'boolean', description: 'Confirm SQL execution' }],
			table: sqlExecutionTable,
			async prepare(context) {
				if (context.options.yes !== true) throw new ServiceCliInputError('SQL exec requires --yes');
				const { statement, params } = await prepareSQLStatement(context);
				return (service, options) => service.exec({ statement, params }, options);
			},
		},
		{
			name: 'explain',
			description: 'Explain a read-only SQL query',
			argument: 'statement',
			variadic: true,
			options: queryOptions,
			table: sqlExecutionTable,
			async prepare(context) {
				const prepared = await prepareSQLStatement(context);
				if (!['sqlite', 'postgresql', 'mysql'].some((dialect) => isReadOnlySQL(prepared.statement, dialect)))
					throw new ServiceCliInputError('SQL explain requires a read-only statement');
				return (service, options) => {
					if (!isReadOnlySQL(prepared.statement, service.dialect))
						throw new ServiceCliInputError('SQL explain requires a read-only statement');
					const statement = /^(?:\s|--[^\r\n]*(?:\r?\n|$)|\/\*[\s\S]*?\*\/)*EXPLAIN\b/iu.test(prepared.statement)
						? prepared.statement
						: `EXPLAIN ${prepared.statement}`;
					return service.query({ ...prepared, statement }, options);
				};
			},
		},
		{
			name: 'ping',
			description: 'Check SQL service connectivity',
			prepare() {
				return (service, options) => service.ping(options);
			},
		},
		...([undefined, 'table'] as const).map((group) => ({
			group,
			name: 'list',
			aliases: group ? ['ls'] : undefined,
			description: 'List SQL tables',
			options: tableOptions,
			table: sqlObjectTable,
			prepare({ options }: Parameters<ServiceCliDefinition<ISqlService>['commands'][number]['prepare']>[0]) {
				const input = listInput(options);
				return (service: ISqlService, callOptions: { signal?: AbortSignal }) => service.listObject(input, callOptions);
			},
		})),
		{
			group: 'table',
			name: 'info',
			aliases: ['describe', 'desc'],
			description: 'Describe a SQL table',
			argument: 'table',
			options: tableOptions,
			table: sqlDescriptionTable,
			prepare({ args, options }) {
				const target = args[0]?.trim();
				if (!target) throw new ServiceCliInputError('SQL table name is required');
				const dot = target.indexOf('.');
				const schema = serviceCliString(options, 'schema') ?? (dot > 0 ? target.slice(0, dot) : undefined);
				const name = dot > 0 ? target.slice(dot + 1) : target;
				if (!name) throw new ServiceCliInputError('SQL table name is required');
				return (service, callOptions) =>
					service.describeObject({ object: { schema, name, type: 'TABLE' } }, callOptions);
			},
		},
	],
};
