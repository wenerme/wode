import { type ServiceCliDefinition, type ServiceCliOption, serviceCliString } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { LinearServiceClient } from '../client';
import * as schema from '../schema';
import {
	linearAssertClearOptions,
	linearDescription,
	linearIssueFields,
	linearPageInput,
	linearParseInput,
	linearReadText,
	linearRequiredOption,
	linearRequireMutation,
} from './input';
import { linearCliTable } from './output';

const teamOption = { name: 'team', description: 'Team ID' } as const;
const queryOption = { name: 'query', description: 'Filter by name or text' } as const;
const yesOption = { name: 'yes', description: 'Confirm mutation', type: 'boolean' } as const;
const issueOptions: readonly ServiceCliOption[] = [
	{ name: 'description', description: 'Issue description or @file' },
	{ name: 'state', description: 'Workflow state ID' },
	{ name: 'assignee', description: 'Assignee ID' },
	{ name: 'project', description: 'Project ID' },
	{ name: 'priority', description: 'Priority 0..4' },
	{ name: 'due-date', description: 'Due date YYYY-MM-DD' },
	{ name: 'label', description: 'Label ID; repeatable', repeatable: true },
	yesOption,
];

function pageOptions(includeArchived = true): ServiceCliOption[] {
	return [
		{ name: 'limit', description: 'Result limit, max 100', default: '50' },
		{ name: 'after', description: 'Relay cursor' },
		...(includeArchived
			? [{ name: 'include-archived', description: 'Include archived resources', type: 'boolean' as const }]
			: []),
	];
}

/** Shared Linear business commands; selection, file I/O and output belong to the host. */
export const LinearCliDefinition = {
	name: 'linear',
	description: 'Linear issues, teams, projects, users, states, and comments',
	helpText:
		'\nOverview:\n' +
		'  status             show the authenticated viewer\n' +
		'  team|state|user|project list\n' +
		'  issue             list · get · create · update\n' +
		'  comment           list · create\n' +
		'  --list-services   list local Linear service candidates\n' +
		'\nExamples:\n' +
		'  woctl linear status --service work\n' +
		'  woctl linear issue ls --team TEAM_ID --limit 50\n' +
		'  woctl linear issue get LIN-123 -o json\n' +
		'  woctl linear issue create "Fix regression" --team TEAM_ID --description @body.md --yes\n' +
		'  woctl linear comment create LIN-123 @comment.md --yes\n',
	examples: [
		{ command: 'woctl linear status --service work', description: 'Show the authenticated viewer.' },
		{ command: 'woctl linear issue ls --team TEAM_ID --limit 50', description: 'List team issues.' },
		{ command: 'woctl linear issue get LIN-123 -o json', description: 'Read the complete issue.' },
		{ command: 'woctl linear issue create "Fix regression" --team TEAM_ID --description @body.md --yes' },
		{ command: 'woctl linear comment create LIN-123 @comment.md --yes' },
	],
	commands: [
		{
			name: 'status',
			description: 'Show the authenticated Linear viewer',
			examples: [{ command: 'woctl linear status', description: 'Show the authenticated viewer.' }],
			table: linearCliTable('viewer'),
			prepare:
				() =>
				(client, { signal }) =>
					client.getViewer({}, { signal }),
		},
		{
			group: 'team',
			name: 'list',
			aliases: ['ls'],
			description: 'List teams',
			options: pageOptions(),
			table: linearCliTable('teams'),
			prepare({ options }) {
				const input = linearParseInput(schema.LinearListTeamInputSchema, linearPageInput(options));
				return (client, { signal }) => client.listTeam(input, { signal });
			},
		},
		{
			group: 'state',
			name: 'list',
			aliases: ['ls'],
			description: 'List workflow states',
			options: [...pageOptions(false), teamOption],
			table: linearCliTable('states'),
			prepare({ options }) {
				const input = linearParseInput(schema.LinearListIssueStateInputSchema, {
					...linearPageInput(options),
					teamId: linearRequiredOption(options, 'team'),
				});
				return (client, { signal }) => client.listIssueState(input, { signal });
			},
		},
		{
			group: 'user',
			name: 'list',
			aliases: ['ls'],
			description: 'List users',
			options: [...pageOptions(), queryOption],
			table: linearCliTable('users'),
			prepare({ options }) {
				const input = linearParseInput(schema.LinearListUserInputSchema, {
					...linearPageInput(options),
					query: serviceCliString(options, 'query'),
				});
				return (client, { signal }) => client.listUser(input, { signal });
			},
		},
		{
			group: 'project',
			name: 'list',
			aliases: ['ls'],
			description: 'List projects',
			options: [...pageOptions(), teamOption, queryOption],
			table: linearCliTable('projects'),
			prepare({ options }) {
				const input = linearParseInput(schema.LinearListProjectInputSchema, {
					...linearPageInput(options),
					teamId: serviceCliString(options, 'team'),
					query: serviceCliString(options, 'query'),
				});
				return (client, { signal }) => client.listProject(input, { signal });
			},
		},
		{
			group: 'issue',
			name: 'list',
			aliases: ['ls'],
			description: 'List issues',
			table: linearCliTable('issues'),
			options: [
				...pageOptions(),
				teamOption,
				queryOption,
				{ name: 'assignee', description: 'Assignee ID' },
				{ name: 'project', description: 'Project ID' },
				{ name: 'state', description: 'Workflow state ID' },
				{ name: 'updated-after', description: 'Only issues updated after ISO timestamp' },
				{ name: 'filter', description: 'Linear IssueFilter JSON or @file' },
			],
			async prepare(context) {
				const { options } = context;
				const baseInput = linearParseInput(schema.LinearListIssueInputSchema, {
					...linearPageInput(options),
					teamId: serviceCliString(options, 'team'),
					assigneeId: serviceCliString(options, 'assignee'),
					projectId: serviceCliString(options, 'project'),
					stateId: serviceCliString(options, 'state'),
					query: serviceCliString(options, 'query'),
					updatedAfter: serviceCliString(options, 'updated-after'),
				});
				const filterValue = serviceCliString(options, 'filter');
				let filter: unknown;
				if (filterValue !== undefined) {
					const text = await linearReadText(context, filterValue, 'Linear issue filter');
					try {
						filter = JSON.parse(text);
					} catch {
						throw new ServiceCliInputError('Linear issue filter must contain valid JSON');
					}
					if (filter === null || typeof filter !== 'object' || Array.isArray(filter)) {
						throw new ServiceCliInputError('Linear issue filter must be a JSON object');
					}
				}
				const input = linearParseInput(schema.LinearListIssueInputSchema, { ...baseInput, filter });
				return (client, { signal }) => client.listIssue(input, { signal });
			},
		},
		{
			group: 'issue',
			name: 'get',
			description: 'Get one issue',
			argument: 'id',
			table: linearCliTable('issue'),
			prepare({ args }) {
				const input = linearParseInput(schema.LinearGetIssueInputSchema, { id: args[0] });
				return (client, { signal }) => client.getIssue(input, { signal });
			},
		},
		{
			group: 'issue',
			name: 'create',
			description: 'Create an issue',
			argument: 'title',
			mutating: true,
			options: [teamOption, ...issueOptions],
			table: linearCliTable('issue'),
			async prepare(context) {
				const { options, args } = context;
				linearRequireMutation(options);
				const fields = linearParseInput(schema.LinearCreateIssueInputSchema, {
					...linearIssueFields(options),
					teamId: linearRequiredOption(options, 'team'),
					title: args[0],
				});
				const input = linearParseInput(schema.LinearCreateIssueInputSchema, {
					...fields,
					description: await linearDescription(context),
				});
				return (client, { signal }) => client.createIssue(input, { signal });
			},
		},
		{
			group: 'issue',
			name: 'update',
			description: 'Update an issue',
			argument: 'id',
			mutating: true,
			options: [
				...issueOptions,
				{ name: 'title', description: 'Issue title' },
				{ name: 'clear-assignee', description: 'Clear assignee', type: 'boolean' },
				{ name: 'clear-project', description: 'Clear project', type: 'boolean' },
				{ name: 'clear-due-date', description: 'Clear due date', type: 'boolean' },
			],
			table: linearCliTable('issue'),
			async prepare(context) {
				const { options, args } = context;
				linearRequireMutation(options);
				linearAssertClearOptions(options);
				const fields = linearParseInput(schema.LinearUpdateIssueInputSchema, {
					...linearIssueFields(options),
					id: args[0],
					title: serviceCliString(options, 'title'),
					description: options.description === undefined ? undefined : '',
					assigneeId: options['clear-assignee'] ? null : serviceCliString(options, 'assignee'),
					projectId: options['clear-project'] ? null : serviceCliString(options, 'project'),
					dueDate: options['clear-due-date'] ? null : serviceCliString(options, 'due-date'),
				});
				const input = linearParseInput(schema.LinearUpdateIssueInputSchema, {
					...fields,
					description: await linearDescription(context),
				});
				return (client, { signal }) => client.updateIssue(input, { signal });
			},
		},
		{
			group: 'comment',
			name: 'list',
			aliases: ['ls'],
			description: 'List issue comments',
			argument: 'issue',
			options: pageOptions(false),
			table: linearCliTable('comments'),
			prepare({ options, args }) {
				const input = linearParseInput(schema.LinearListCommentInputSchema, {
					...linearPageInput(options),
					issueId: args[0],
				});
				return (client, { signal }) => client.listComment(input, { signal });
			},
		},
		{
			group: 'comment',
			name: 'create',
			description: 'Create an issue comment',
			arguments: '<issue> <body>',
			mutating: true,
			options: [yesOption],
			table: linearCliTable('comment'),
			async prepare(context) {
				linearRequireMutation(context.options);
				const { id } = linearParseInput(schema.LinearGetIssueInputSchema, { id: context.args[0] });
				const input = linearParseInput(schema.LinearCreateCommentInputSchema, {
					issueId: id,
					body: await linearReadText(context, context.args[1] ?? '', 'Linear comment'),
				});
				return (client, { signal }) => client.createComment(input, { signal });
			},
		},
	],
} satisfies ServiceCliDefinition<LinearServiceClient>;
