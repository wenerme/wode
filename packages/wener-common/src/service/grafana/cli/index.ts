import { isGrafanaWriteMethod } from '@wener/client/grafana';
import type { CliTable } from '../../../cli/render/CliTable';
import { type ServiceCliDefinition, serviceCliString, serviceCliStrings } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { IGrafanaService } from '../index';
import { sanitizeGrafanaOutput } from '../sanitize';

/** 与 Grafana Service 的缺省规则一致；这里只决定 CLI 的确认和文件读取顺序。 */
function grafanaApiMethod(options: { method?: string; body?: string }): string {
	const method = (options.method ?? (options.body === undefined ? 'GET' : 'POST')).trim().toUpperCase();
	if (!['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
		throw new ServiceCliInputError('--method must be GET, HEAD, OPTIONS, POST, PUT, PATCH or DELETE');
	}
	if (['GET', 'HEAD'].includes(method) && options.body !== undefined) {
		throw new ServiceCliInputError('--body cannot be used with GET or HEAD');
	}
	return method;
}

function parseGrafanaLimit(value: string | undefined): number | undefined {
	if (value === undefined) return undefined;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || String(parsed) !== value.trim() || parsed < 1 || parsed > 500)
		throw new ServiceCliInputError('--limit must be an integer between 1 and 500');
	return parsed;
}

/** Mirrors wode-gf-cli's `parsePanelRef`: splits on the last `/`, DASHBOARD_UID/PANEL_ID. */
function parseGrafanaPanelRef(ref: string): { dashboardUid: string; panelId: number } {
	const text = ref.trim();
	const index = text.lastIndexOf('/');
	if (index <= 0 || index === text.length - 1)
		throw new ServiceCliInputError('Panel ref must be DASHBOARD_UID/PANEL_ID, for example my-dashboard/3');
	const dashboardUid = text.slice(0, index).trim();
	const panelToken = text.slice(index + 1).trim();
	if (!dashboardUid || !/^\d+$/u.test(panelToken))
		throw new ServiceCliInputError('Panel ref must be DASHBOARD_UID/PANEL_ID, for example my-dashboard/3');
	return { dashboardUid, panelId: Number.parseInt(panelToken, 10) };
}

/** Parses a `path=value` pair for `panel patch --set`; the value is JSON when parseable, otherwise a raw string. */
function parseGrafanaPanelSet(entry: string): [string, unknown] {
	const { path, raw } = splitGrafanaPanelSetEntry(entry, 'set');
	try {
		return [path, JSON.parse(raw)];
	} catch {
		return [path, raw];
	}
}

/** Parses a `path=value` pair for `panel patch --set-string`; the right-hand side is always a raw string, including an empty one. */
function parseGrafanaPanelSetString(entry: string): [string, unknown] {
	const { path, raw } = splitGrafanaPanelSetEntry(entry, 'set-string');
	return [path, raw];
}

/** Parses a `path=value` pair for `panel patch --set-json`; the right-hand side must parse as JSON. */
function parseGrafanaPanelSetJson(entry: string): [string, unknown] {
	const { path, raw } = splitGrafanaPanelSetEntry(entry, 'set-json');
	try {
		return [path, JSON.parse(raw)];
	} catch {
		throw new ServiceCliInputError(`--set-json value for "${path}" must contain valid JSON`);
	}
}

function splitGrafanaPanelSetEntry(entry: string, label: string): { path: string; raw: string } {
	const at = entry.indexOf('=');
	if (at < 0) throw new ServiceCliInputError(`--${label} expects path=value`);
	const path = entry.slice(0, at);
	if (!path.trim()) throw new ServiceCliInputError(`--${label} requires a non-empty path`);
	return { path, raw: entry.slice(at + 1) };
}

/** Merges `--set`, `--set-string` and `--set-json` entries into one path=>value map; a path repeated across the three options is rejected instead of silently overwritten. */
function mergeGrafanaPanelSetEntries(
	setEntries: readonly [string, unknown][],
	setStringEntries: readonly [string, unknown][],
	setJsonEntries: readonly [string, unknown][],
): Record<string, unknown> {
	// Keep user supplied path keys as data. In particular, `__proto__` must reach the
	// client path validator instead of invoking Object.prototype's legacy setter here.
	const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
	for (const [path, value] of [...setEntries, ...setStringEntries, ...setJsonEntries]) {
		if (Object.hasOwn(result, path)) throw new ServiceCliInputError(`Duplicate --set/--set-string/--set-json path: ${path}`);
		result[path] = value;
	}
	return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * `dashboard update` accepts either a bare dashboard payload or the `{ dashboard, meta }` wrapper
 * returned by `dashboard get`, so the output of `get` can be piped straight into `update` without
 * manual unwrapping. `meta.folderUid` becomes the default destination folder when `--folder-uid`
 * is not given explicitly.
 */
function unwrapGrafanaDashboardFile(parsed: unknown): { dashboard: unknown; folderUid?: string } {
	if (isPlainObject(parsed) && isPlainObject(parsed.dashboard)) {
		const meta = isPlainObject(parsed.meta) ? parsed.meta : undefined;
		return { dashboard: parsed.dashboard, folderUid: typeof meta?.folderUid === 'string' ? meta.folderUid : undefined };
	}
	return { dashboard: parsed };
}

/** Extracts a bounded, agent-friendly column set from a dashboard search result; JSON output keeps the full payload. */
function dashboardListTable(value: unknown): CliTable {
	const rows = Array.isArray(value) ? value : [];
	const headers = ['uid', 'title', 'folderTitle', 'tags', 'url'];
	return {
		headers,
		rows: rows.map((entry) => {
			const item = isPlainObject(entry) ? entry : {};
			return [
				typeof item.uid === 'string' ? item.uid : '',
				typeof item.title === 'string' ? item.title : '',
				typeof item.folderTitle === 'string' ? item.folderTitle : '',
				Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === 'string').join(',') : '',
				typeof item.url === 'string' ? item.url : '',
			];
		}),
	};
}

export const GrafanaCliDefinition: ServiceCliDefinition<IGrafanaService> = {
	name: 'grafana',
	aliases: ['gf'],
	description: 'Check Grafana health and call the authenticated Grafana HTTP API',
	options: [],
	commands: [
		{
			name: 'status', description: 'Check Grafana health',
			prepare: () => async (service, callOptions) => sanitizeGrafanaOutput(await service.health(callOptions)),
		},
		{
			name: 'whoami', description: 'Read the current authenticated Grafana user',
			prepare: () => async (service, callOptions) => sanitizeGrafanaOutput(await service.whoAmI(callOptions)),
		},
		{
			name: 'api', argument: 'path', description: 'Call a Grafana API path; non-read methods require --yes and a writable service',
			options: [
				{ name: 'method', aliases: ['X'], description: 'HTTP method; GET by default, POST with --body' },
				{ name: 'query', description: 'Query parameter key=value; repeatable', repeatable: true },
				{ name: 'body', description: 'JSON body, @file or - for stdin' },
				{ name: 'yes', description: 'Confirm a write request', type: 'boolean' },
			],
			async prepare(context) {
				const path = context.args[0];
				if (!path) throw new ServiceCliInputError('Grafana API path is required');
				const bodyArgument = serviceCliString(context.options, 'body');
				const method = grafanaApiMethod({ method: serviceCliString(context.options, 'method'), body: bodyArgument });
				if (isGrafanaWriteMethod(method) && context.options.yes !== true)
					throw new ServiceCliInputError('Grafana API write requires --yes');
				const params: Record<string, string | string[]> = Object.create(null);
				for (const value of serviceCliStrings(context.options, 'query') ?? []) {
					const at = value.indexOf('=');
					if (at < 1) throw new ServiceCliInputError('--query expects key=value');
					const key = value.slice(0, at);
					const entry = value.slice(at + 1);
					const previous = params[key];
					params[key] = previous === undefined ? entry : [...(Array.isArray(previous) ? previous : [previous]), entry];
				}
				let body: unknown;
				if (bodyArgument !== undefined) {
					const text = await context.readText(bodyArgument, { label: 'Grafana API body', maxBytes: 1024 * 1024 });
					try {
						body = JSON.parse(text);
					} catch {
						throw new ServiceCliInputError('--body must contain valid JSON');
					}
				}
				const input = { path, method, params, ...(body === undefined ? {} : { body }) };
				return async (service, callOptions) => sanitizeGrafanaOutput(await service.request(input, callOptions));
			},
		},
		{
			name: 'list', group: 'dashboard', description: 'List/search dashboards',
			options: [
				{ name: 'query', description: 'Search text' },
				{ name: 'tag', description: 'Filter by tag; repeatable', repeatable: true },
				{ name: 'folder-uid', description: 'Filter by folder uid' },
				{ name: 'limit', description: 'Maximum number of results (1-500)' },
			],
			table: dashboardListTable,
			async prepare(context) {
				const input = {
					query: serviceCliString(context.options, 'query'),
					tag: serviceCliStrings(context.options, 'tag'),
					folderUid: serviceCliString(context.options, 'folder-uid'),
					limit: parseGrafanaLimit(serviceCliString(context.options, 'limit')),
				};
				return async (service, callOptions) => sanitizeGrafanaOutput(await service.listDashboard(input, callOptions));
			},
		},
		{
			name: 'get', group: 'dashboard', argument: 'uid', description: 'Get a dashboard by uid',
			prepare(context) {
				const uid = context.args[0];
				if (!uid) throw new ServiceCliInputError('Grafana dashboard uid is required');
				return async (service, callOptions) => sanitizeGrafanaOutput(await service.getDashboard({ uid }, callOptions));
			},
		},
		{
			name: 'update', group: 'dashboard', argument: 'file', description: 'Create or update a dashboard from a JSON file; requires --yes unless --dry-run is set',
			mutating: true,
			supportsDryRun: true,
			options: [
				{ name: 'folder-uid', description: 'Destination folder uid' },
				{ name: 'message', description: 'Save message' },
				{ name: 'overwrite', description: 'Overwrite an existing dashboard version conflict', type: 'boolean' },
				{ name: 'yes', description: 'Confirm a write request', type: 'boolean' },
				{ name: 'dry-run', description: 'Validate without writing; does not require --yes', type: 'boolean' },
			],
			async prepare(context) {
				const file = context.args[0];
				if (!file) throw new ServiceCliInputError('Grafana dashboard file is required');
				const dryRun = context.options['dry-run'] === true;
				if (!dryRun && context.options.yes !== true) throw new ServiceCliInputError('Grafana dashboard update requires --yes');
				const text = await context.readText(file, { label: 'Grafana dashboard', maxBytes: 4 * 1024 * 1024 });
				let parsed: unknown;
				try {
					parsed = JSON.parse(text);
				} catch {
					throw new ServiceCliInputError('Grafana dashboard file must contain valid JSON');
				}
				// Accepts a bare dashboard payload or the `{ dashboard, meta }` wrapper from `dashboard get`,
				// so `get`'s output can round-trip straight into `update`.
				const { dashboard, folderUid: inheritedFolderUid } = unwrapGrafanaDashboardFile(parsed);
				const input = {
					dashboard,
					folderUid: serviceCliString(context.options, 'folder-uid') ?? inheritedFolderUid,
					message: serviceCliString(context.options, 'message'),
					overwrite: context.options.overwrite === true,
					...(dryRun ? { dryRun: true } : {}),
				};
				return async (service, callOptions) => sanitizeGrafanaOutput(await service.updateDashboard(input, callOptions));
			},
		},
		{
			name: 'get', group: 'panel', argument: 'ref', description: 'Get a single panel by DASHBOARD_UID/PANEL_ID',
			async prepare(context) {
				const ref = context.args[0];
				if (!ref) throw new ServiceCliInputError('Panel ref is required');
				const { dashboardUid, panelId } = parseGrafanaPanelRef(ref);
				return async (service, callOptions) => sanitizeGrafanaOutput(await service.getPanel({ dashboardUid, panelId }, callOptions));
			},
		},
		{
			name: 'patch', group: 'panel', argument: 'ref',
			description:
				'Patch a single panel by DASHBOARD_UID/PANEL_ID; exactly one of --set, --set-string, --set-json, --merge or --from is required, as is --yes unless --dry-run is set',
			mutating: true,
			supportsDryRun: true,
			options: [
				{ name: 'set', description: 'path=value assignment on the panel JSON; JSON when parseable, otherwise a raw string; repeatable', repeatable: true },
				{ name: 'set-string', description: 'path=value assignment on the panel JSON; the value is always a raw string, including an empty one; repeatable', repeatable: true },
				{ name: 'set-json', description: 'path=value assignment on the panel JSON; the value must parse as JSON; repeatable', repeatable: true },
				{ name: 'merge', description: 'JSON object, @file or - deep-merged into the panel' },
				{ name: 'from', description: 'JSON file or - that replaces the whole panel' },
				{ name: 'message', description: 'Save message' },
				{ name: 'yes', description: 'Confirm a write request', type: 'boolean' },
				{ name: 'dry-run', description: 'Validate without writing; does not require --yes', type: 'boolean' },
			],
			async prepare(context) {
				const ref = context.args[0];
				if (!ref) throw new ServiceCliInputError('Panel ref is required');
				const { dashboardUid, panelId } = parseGrafanaPanelRef(ref);
				const setEntries = serviceCliStrings(context.options, 'set');
				const setStringEntries = serviceCliStrings(context.options, 'set-string');
				const setJsonEntries = serviceCliStrings(context.options, 'set-json');
				const hasSet = setEntries !== undefined || setStringEntries !== undefined || setJsonEntries !== undefined;
				const mergeArgument = serviceCliString(context.options, 'merge');
				const fromArgument = serviceCliString(context.options, 'from');
				const modeCount = Number(hasSet) + Number(mergeArgument !== undefined) + Number(fromArgument !== undefined);
				if (modeCount !== 1) throw new ServiceCliInputError('Provide exactly one of --set, --merge or --from (--set-string and --set-json also count as --set)');
				const dryRun = context.options['dry-run'] === true;
				if (!dryRun && context.options.yes !== true) throw new ServiceCliInputError('Grafana panel patch requires --yes');
				const message = serviceCliString(context.options, 'message');
				let set: Record<string, unknown> | undefined;
				let merge: Record<string, unknown> | undefined;
				let replace: unknown;
				if (hasSet) {
					set = mergeGrafanaPanelSetEntries(
						(setEntries ?? []).map(parseGrafanaPanelSet),
						(setStringEntries ?? []).map(parseGrafanaPanelSetString),
						(setJsonEntries ?? []).map(parseGrafanaPanelSetJson),
					);
				} else if (mergeArgument !== undefined) {
					const text = await context.readText(mergeArgument, { label: 'Grafana panel merge', maxBytes: 1024 * 1024 });
					try {
						merge = JSON.parse(text);
					} catch {
						throw new ServiceCliInputError('--merge must contain valid JSON');
					}
				} else {
					const text = await context.readText(fromArgument!, { label: 'Grafana panel replacement', maxBytes: 1024 * 1024 });
					try {
						replace = JSON.parse(text);
					} catch {
						throw new ServiceCliInputError('--from must contain valid JSON');
					}
				}
				const input = { dashboardUid, panelId, set, merge, replace, message, ...(dryRun ? { dryRun: true } : {}) };
				return async (service, callOptions) => sanitizeGrafanaOutput(await service.patchPanel(input, callOptions));
			},
		},
	],
};
