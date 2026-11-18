import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import { GrafanaCliDefinition } from './cli';
import type { IGrafanaService } from './index';

const operation = (name: string, group?: string) => GrafanaCliDefinition.commands.find((entry) => entry.name === name && (group === undefined || entry.group === group))!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({
	args, options, readText: vi.fn(async (value: string) => value),
});
const grafanaClient = (overrides: Partial<IGrafanaService>): IGrafanaService => ({
	type: 'grafana', readOnly: false,
	close: vi.fn<IGrafanaService['close']>(),
	[Symbol.asyncDispose]: vi.fn<IGrafanaService[typeof Symbol.asyncDispose]>(),
	health: vi.fn<IGrafanaService['health']>(),
	whoami: vi.fn<IGrafanaService['whoami']>(),
	request: vi.fn<IGrafanaService['request']>(),
	listDashboard: vi.fn<IGrafanaService['listDashboard']>(),
	getDashboard: vi.fn<IGrafanaService['getDashboard']>(),
	updateDashboard: vi.fn<IGrafanaService['updateDashboard']>(),
	listPanel: vi.fn<IGrafanaService['listPanel']>(),
	getPanel: vi.fn<IGrafanaService['getPanel']>(),
	patchPanel: vi.fn<IGrafanaService['patchPanel']>(),
	...overrides,
});

describe('Grafana CLI preparation', () => {
	it('exposes the grafana name and gf alias', () => {
		expect(GrafanaCliDefinition.name).toBe('grafana');
		expect(GrafanaCliDefinition.aliases).toContain('gf');
	});

	it('prepares status without requiring arguments or confirmation', async () => {
		const client = { health: vi.fn(async () => ({ database: 'ok' })) } as unknown as IGrafanaService;
		const run = await operation('status').prepare(context());
		const options = { signal: new AbortController().signal };
		await run(client, options);
		expect(client.health).toHaveBeenCalledExactlyOnceWith(undefined, options);
	});

	it('prepares whoami without requiring arguments or confirmation', async () => {
		const client = { whoami: vi.fn(async () => ({ login: 'admin' })) } as unknown as IGrafanaService;
		const run = await operation('whoami').prepare(context());
		const options = { signal: new AbortController().signal };
		await run(client, options);
		expect(client.whoami).toHaveBeenCalledExactlyOnceWith(undefined, options);
	});

	it('allows a GET api call without --yes', async () => {
		const client = { request: vi.fn(async () => []) } as unknown as IGrafanaService;
		const run = await operation('api').prepare(context(['/api/search'], { query: 'type=dash-db' }));
		await run(client, {});
		expect(client.request).toHaveBeenCalledWith({ path: '/api/search', method: 'GET', params: { type: 'dash-db' } }, {});
	});

	it('rejects a write method without --yes', async () => {
		await expect(operation('api').prepare(context(['/api/dashboards/db'], { method: 'POST', body: '{}' }))).rejects.toThrow('requires --yes');
	});

	it('accepts a write method with --yes and parses the JSON body', async () => {
		const client = { request: vi.fn(async () => ({ id: 1 })) } as unknown as IGrafanaService;
		const run = await operation('api').prepare(context(['/api/dashboards/db'], { method: 'POST', body: '{"dashboard":{"title":"x"}}', yes: true }));
		await run(client, {});
		expect(client.request).toHaveBeenCalledWith({ path: '/api/dashboards/db', method: 'POST', params: {}, body: { dashboard: { title: 'x' } } }, {});
	});

	it('rejects an invalid JSON body', async () => {
		await expect(operation('api').prepare(context(['/api/dashboards/db'], { method: 'POST', body: 'not json', yes: true }))).rejects.toThrow('valid JSON');
	});

	it('rejects a GET request with a body', async () => {
		await expect(operation('api').prepare(context(['/api/health'], { method: 'GET', body: '{}' }))).rejects.toThrow(ServiceCliInputError);
	});

	it('requires a path argument', async () => {
		await expect(operation('api').prepare(context([]))).rejects.toThrow('path is required');
	});

	it('lists dashboards with query/tag/folder-uid/limit options', async () => {
		const client = { listDashboard: vi.fn(async () => []) } as unknown as IGrafanaService;
		const run = await operation('list', 'dashboard').prepare(context([], { query: 'cpu', tag: ['a', 'b'], 'folder-uid': 'folder-1', limit: '20' }));
		await run(client, {});
		expect(client.listDashboard).toHaveBeenCalledWith({ query: 'cpu', tag: ['a', 'b'], folderUid: 'folder-1', limit: 20 }, {});
	});

	it('rejects an invalid dashboard list limit', async () => {
		await expect(operation('list', 'dashboard').prepare(context([], { limit: 'abc' }))).rejects.toThrow(ServiceCliInputError);
		await expect(operation('list', 'dashboard').prepare(context([], { limit: '0' }))).rejects.toThrow(ServiceCliInputError);
		await expect(operation('list', 'dashboard').prepare(context([], { limit: '501' }))).rejects.toThrow(ServiceCliInputError);
	});

	it('forwards dashboard search pagination and rejects an invalid page', async () => {
		const client = { listDashboard: vi.fn(async () => []) } as unknown as IGrafanaService;
		const run = await operation('list', 'dashboard').prepare(context([], { page: '3', limit: '20' }));
		await run(client, {});
		expect(client.listDashboard).toHaveBeenCalledWith(expect.objectContaining({ page: 3, limit: 20 }), {});
		for (const page of ['0', '-1', '1.5', 'abc', '9007199254740992'])
			await expect(operation('list', 'dashboard').prepare(context([], { page }))).rejects.toThrow(ServiceCliInputError);
	});

	it('lists panels by dashboard uid without confirmation', async () => {
		const client = { listPanel: vi.fn(async () => [{ id: 3 }]) } as unknown as IGrafanaService;
		const run = await operation('list', 'panel').prepare(context(['dash-1']));
		await run(client, {});
		expect(client.listPanel).toHaveBeenCalledWith({ dashboardUid: 'dash-1' }, {});
		await expect(operation('list', 'panel').prepare(context())).rejects.toThrow('uid is required');
	});

	it('passes explicit version preconditions to dashboard update and panel patch', async () => {
		const client = { updateDashboard: vi.fn(async () => ({})), patchPanel: vi.fn(async () => ({})) } as unknown as IGrafanaService;
		const update = context(['dashboard.json'], { 'dry-run': true, 'expected-version': '0' });
		update.readText.mockResolvedValue('{"uid":"dash-1"}');
		await (await operation('update', 'dashboard').prepare(update))(client, {});
		expect(client.updateDashboard).toHaveBeenCalledWith(expect.objectContaining({ expectedVersion: 0 }), {});
		await (await operation('patch', 'panel').prepare(context(['dash-1/3'], { 'dry-run': true, 'expected-version': '4', set: 'title=CPU' })))(client, {});
		expect(client.patchPanel).toHaveBeenCalledWith(expect.objectContaining({ expectedVersion: 4 }), {});
	});

	it('rejects incompatible version options before reading a dashboard file', async () => {
		const input = context(['dashboard.json'], { yes: true, overwrite: true, 'expected-version': '2' });
		await expect(operation('update', 'dashboard').prepare(input)).rejects.toThrow('cannot be used with --overwrite');
		expect(input.readText).not.toHaveBeenCalled();
	});

	it('rejects scalar dashboard and panel replacement inputs', async () => {
		const update = context(['dashboard.json'], { yes: true });
		update.readText.mockResolvedValue('[]');
		await expect(operation('update', 'dashboard').prepare(update)).rejects.toThrow('valid classic dashboard object');
		await expect(operation('patch', 'panel').prepare(context(['dash-1/3'], { yes: true, from: 'null' }))).rejects.toThrow('Invalid classic Grafana panel patch');
	});

	it('gets a dashboard by uid', async () => {
		const client = { getDashboard: vi.fn(async () => ({ dashboard: {} })) } as unknown as IGrafanaService;
		const run = await operation('get', 'dashboard').prepare(context(['dash-1']));
		await run(client, {});
		expect(client.getDashboard).toHaveBeenCalledWith({ uid: 'dash-1' }, {});
	});

	it.each([undefined, true])('round-trips full dashboard JSON and panel JSON when redact=%s', async (redact) => {
		const panel = {
			id: 3, title: 'Bearer fixture-token Basic Zml4dHVyZTpwYXNz', type: 'text',
			options: { password: 'business-password', token: 'business-token', content: 'https://user:pass@example.test '.repeat(1_024) },
		};
		const dashboard = { dashboard: { uid: 'dash-1', title: 'Audit', panels: [panel], token: 'dashboard-variable' }, meta: { folderUid: 'folder-9' } };
		const saved = { status: 'success', token: 'save-result' };
		const patched = { changed: false, panel, dashboard: { uid: 'dash-1' } };
		const client = grafanaClient({
			getDashboard: vi.fn<IGrafanaService['getDashboard']>().mockResolvedValue(dashboard),
			updateDashboard: vi.fn<IGrafanaService['updateDashboard']>().mockResolvedValue(saved),
			getPanel: vi.fn<IGrafanaService['getPanel']>().mockResolvedValue(panel),
			patchPanel: vi.fn<IGrafanaService['patchPanel']>().mockResolvedValue(patched),
		});
		const callOptions = { signal: new AbortController().signal };
		const readDashboard = await operation('get', 'dashboard').prepare(context(['dash-1'], { redact }));
		const dashboardResult = await readDashboard(client, callOptions);
		expect(dashboardResult).toBe(dashboard);
		const updateInput = context(['dashboard.json'], { yes: true, redact });
		updateInput.readText.mockResolvedValue(JSON.stringify(dashboardResult));
		const update = await operation('update', 'dashboard').prepare(updateInput);
		expect(await update(client, callOptions)).toBe(saved);
		expect(client.updateDashboard).toHaveBeenCalledExactlyOnceWith({ dashboard: dashboard.dashboard, folderUid: 'folder-9', message: undefined, overwrite: false }, callOptions);

		const readPanel = await operation('get', 'panel').prepare(context(['dash-1/3'], { redact }));
		const panelResult = await readPanel(client, callOptions);
		expect(panelResult).toBe(panel);
		const patchInput = context(['dash-1/3'], { yes: true, from: 'panel.json', redact });
		patchInput.readText.mockResolvedValue(JSON.stringify(panelResult));
		const patch = await operation('patch', 'panel').prepare(patchInput);
		expect(await patch(client, callOptions)).toBe(patched);
		expect(client.patchPanel).toHaveBeenCalledExactlyOnceWith({ dashboardUid: 'dash-1', panelId: 3, replace: panel, message: undefined }, callOptions);
	});

	it.each([undefined, true])('returns the original raw API string when redact=%s', async (redact) => {
		const result = 'Bearer fixture-token https://user:pass@example.test '.repeat(1_024);
		const client = grafanaClient({ request: vi.fn<IGrafanaService['request']>().mockResolvedValue(result) });
		const run = await operation('api').prepare(context(['/api/plugin/example'], { redact }));
		expect(await run(client, {})).toBe(result);
	});

	it('rejects a dashboard update without --yes', async () => {
		await expect(operation('update', 'dashboard').prepare(context(['dashboard.json']))).rejects.toThrow('requires --yes');
	});

	it('updates a dashboard from a JSON file with --yes', async () => {
		const client = { updateDashboard: vi.fn(async () => ({ status: 'success' })) } as unknown as IGrafanaService;
		const input = context(['dashboard.json'], { 'folder-uid': 'folder-1', message: 'update', overwrite: true, yes: true });
		input.readText.mockResolvedValue('{"uid":"dash-1","title":"New"}');
		const run = await operation('update', 'dashboard').prepare(input);
		await run(client, {});
		expect(client.updateDashboard).toHaveBeenCalledWith({ dashboard: { uid: 'dash-1', title: 'New' }, folderUid: 'folder-1', message: 'update', overwrite: true }, {});
	});

	it('rejects a dashboard update with invalid JSON', async () => {
		const input = context(['dashboard.json'], { yes: true });
		input.readText.mockResolvedValue('not json');
		await expect(operation('update', 'dashboard').prepare(input)).rejects.toThrow('valid JSON');
	});

	it('unwraps a get-response wrapper and inherits meta.folderUid for dashboard update', async () => {
		const client = { updateDashboard: vi.fn(async () => ({ status: 'success' })) } as unknown as IGrafanaService;
		const input = context(['dashboard.json'], { yes: true });
		input.readText.mockResolvedValue(JSON.stringify({ dashboard: { uid: 'dash-1', title: 'New' }, meta: { folderUid: 'folder-9' } }));
		const run = await operation('update', 'dashboard').prepare(input);
		await run(client, {});
		expect(client.updateDashboard).toHaveBeenCalledWith({ dashboard: { uid: 'dash-1', title: 'New' }, folderUid: 'folder-9', message: undefined, overwrite: false }, {});
	});

	it('prefers an explicit --folder-uid over the wrapper meta.folderUid', async () => {
		const client = { updateDashboard: vi.fn(async () => ({ status: 'success' })) } as unknown as IGrafanaService;
		const input = context(['dashboard.json'], { yes: true, 'folder-uid': 'folder-explicit' });
		input.readText.mockResolvedValue(JSON.stringify({ dashboard: { uid: 'dash-1', title: 'New' }, meta: { folderUid: 'folder-9' } }));
		const run = await operation('update', 'dashboard').prepare(input);
		await run(client, {});
		expect(client.updateDashboard).toHaveBeenCalledWith({ dashboard: { uid: 'dash-1', title: 'New' }, folderUid: 'folder-explicit', message: undefined, overwrite: false }, {});
	});

	it('keeps a bare dashboard JSON working unchanged', async () => {
		const client = { updateDashboard: vi.fn(async () => ({ status: 'success' })) } as unknown as IGrafanaService;
		const input = context(['dashboard.json'], { yes: true });
		input.readText.mockResolvedValue(JSON.stringify({ uid: 'dash-1', title: 'Bare' }));
		const run = await operation('update', 'dashboard').prepare(input);
		await run(client, {});
		expect(client.updateDashboard).toHaveBeenCalledWith({ dashboard: { uid: 'dash-1', title: 'Bare' }, folderUid: undefined, message: undefined, overwrite: false }, {});
	});

	it('marks dashboard update and panel patch as mutating, and only those', () => {
		const mutating = (name: string, group?: string) => operation(name, group).mutating === true;
		expect(mutating('status')).toBe(false);
		expect(mutating('whoami')).toBe(false);
		expect(mutating('api')).toBe(false);
		expect(mutating('list', 'dashboard')).toBe(false);
		expect(mutating('get', 'dashboard')).toBe(false);
		expect(mutating('update', 'dashboard')).toBe(true);
		expect(mutating('get', 'panel')).toBe(false);
		expect(mutating('patch', 'panel')).toBe(true);
	});

	it('renders a dashboard list table with bounded columns', () => {
		const table = operation('list', 'dashboard').table!([
			{ uid: 'dash-1', title: 'Dashboard One', folderTitle: 'General', tags: ['a', 'b'], url: '/d/dash-1', extra: 'ignored' },
			{ uid: 'dash-2', title: 'Dashboard Two' },
		]);
		expect(table.headers).toEqual(['uid', 'title', 'folderTitle', 'tags', 'url']);
		expect(table.rows).toEqual([
			['dash-1', 'Dashboard One', 'General', 'a,b', '/d/dash-1'],
			['dash-2', 'Dashboard Two', '', '', ''],
		]);
	});

	it('gets a panel by DASHBOARD_UID/PANEL_ID ref', async () => {
		const client = { getPanel: vi.fn(async () => ({ id: 3 })) } as unknown as IGrafanaService;
		const run = await operation('get', 'panel').prepare(context(['my-dashboard/3']));
		await run(client, {});
		expect(client.getPanel).toHaveBeenCalledWith({ dashboardUid: 'my-dashboard', panelId: 3 }, {});
	});

	it.each(['my-dashboard', 'my-dashboard/abc', 'my-dashboard/', '/3'])('rejects an invalid panel ref %s', async (ref) => {
		await expect(operation('get', 'panel').prepare(context([ref]))).rejects.toThrow('Panel ref must be DASHBOARD_UID/PANEL_ID');
	});

	it('rejects panel patch without --set, --merge or --from', async () => {
		await expect(operation('patch', 'panel').prepare(context(['my-dashboard/3'], { yes: true }))).rejects.toThrow('exactly one of --set, --merge or --from');
	});

	it('rejects panel patch with more than one of --set, --merge or --from', async () => {
		await expect(operation('patch', 'panel').prepare(context(['my-dashboard/3'], { yes: true, set: 'title=x', merge: '{}' }))).rejects.toThrow('exactly one of --set, --merge or --from');
	});

	it('rejects panel patch without --yes', async () => {
		await expect(operation('patch', 'panel').prepare(context(['my-dashboard/3'], { set: 'title=x' }))).rejects.toThrow('requires --yes');
	});

	it('patches a panel with --set, inferring JSON values and falling back to strings', async () => {
		const client = { patchPanel: vi.fn(async () => ({ status: 'success' })) } as unknown as IGrafanaService;
		const run = await operation('patch', 'panel').prepare(context(['my-dashboard/3'], { yes: true, set: ['title=CPU', 'fieldConfig.defaults.unit="bytes"'], message: 'tweak' }));
		await run(client, {});
		expect(client.patchPanel).toHaveBeenCalledWith({
			dashboardUid: 'my-dashboard', panelId: 3,
			set: { title: 'CPU', 'fieldConfig.defaults.unit': 'bytes' },
			merge: undefined, replace: undefined, message: 'tweak',
		}, {});
	});

	it('patches a panel with --merge read from a file', async () => {
		const client = { patchPanel: vi.fn(async () => ({ status: 'success' })) } as unknown as IGrafanaService;
		const input = context(['my-dashboard/3'], { yes: true, merge: 'panel-merge.json' });
		input.readText.mockResolvedValue('{"fieldConfig":{"defaults":{"min":0}}}');
		const run = await operation('patch', 'panel').prepare(input);
		await run(client, {});
		expect(client.patchPanel).toHaveBeenCalledWith({
			dashboardUid: 'my-dashboard', panelId: 3,
			set: undefined, merge: { fieldConfig: { defaults: { min: 0 } } }, replace: undefined, message: undefined,
		}, {});
	});

	it('patches a panel with --from read from a file', async () => {
		const client = { patchPanel: vi.fn(async () => ({ status: 'success' })) } as unknown as IGrafanaService;
		const input = context(['my-dashboard/3'], { yes: true, from: 'panel.json' });
		input.readText.mockResolvedValue('{"id":3,"title":"Replaced"}');
		const run = await operation('patch', 'panel').prepare(input);
		await run(client, {});
		expect(client.patchPanel).toHaveBeenCalledWith({
			dashboardUid: 'my-dashboard', panelId: 3,
			set: undefined, merge: undefined, replace: { id: 3, title: 'Replaced' }, message: undefined,
		}, {});
	});

	it('keeps --set-string values as raw strings, including number/boolean/null-looking tokens', async () => {
		const client = { patchPanel: vi.fn(async () => ({ status: 'success' })) } as unknown as IGrafanaService;
		const run = await operation('patch', 'panel').prepare(
			context(['my-dashboard/3'], { yes: true, 'set-string': ['a=1', 'b=true', 'c=null', 'd='] }),
		);
		await run(client, {});
		expect(client.patchPanel).toHaveBeenCalledWith({
			dashboardUid: 'my-dashboard', panelId: 3,
			set: { a: '1', b: 'true', c: 'null', d: '' },
			merge: undefined, replace: undefined, message: undefined,
		}, {});
	});

	it('parses --set-json values as JSON, including number/boolean/null/object', async () => {
		const client = { patchPanel: vi.fn(async () => ({ status: 'success' })) } as unknown as IGrafanaService;
		const run = await operation('patch', 'panel').prepare(
			context(['my-dashboard/3'], { yes: true, 'set-json': ['a=1', 'b=true', 'c=null', 'd={"x":1}'] }),
		);
		await run(client, {});
		expect(client.patchPanel).toHaveBeenCalledWith({
			dashboardUid: 'my-dashboard', panelId: 3,
			set: { a: 1, b: true, c: null, d: { x: 1 } },
			merge: undefined, replace: undefined, message: undefined,
		}, {});
	});

	it('rejects an invalid --set-json value', async () => {
		await expect(
			operation('patch', 'panel').prepare(context(['my-dashboard/3'], { yes: true, 'set-json': ['a=not json'] })),
		).rejects.toThrow('must contain valid JSON');
	});

	it('rejects a path repeated across --set/--set-string/--set-json', async () => {
		await expect(
			operation('patch', 'panel').prepare(
				context(['my-dashboard/3'], { yes: true, set: ['a=1'], 'set-string': ['a=x'] }),
			),
		).rejects.toThrow('Duplicate --set/--set-string/--set-json path');
	});

	it('rejects an empty path in --set/--set-string/--set-json', async () => {
		await expect(
			operation('patch', 'panel').prepare(context(['my-dashboard/3'], { yes: true, set: ['=value'] })),
		).rejects.toThrow('requires a non-empty path');
	});

	it.each([
		{ set: '__proto__={"polluted":true}' },
		{ 'set-string': '__proto__=value' },
		{ 'set-json': '__proto__={"polluted":true}' },
		{ merge: '{"__proto__":{"polluted":true},"title":"CPU"}' },
	])('rejects prototype-key edits during CLI preparation: %j', async (options) => {
		await expect(operation('patch', 'panel').prepare(context(['d/1'], { ...options, 'dry-run': true }))).rejects.toThrow('Invalid classic Grafana panel patch');
	});

	it('allows a dashboard update dry-run without --yes and marks it in the service call', async () => {
		const client = { updateDashboard: vi.fn(async () => ({ status: 'success' })) } as unknown as IGrafanaService;
		const input = context(['dashboard.json'], { 'dry-run': true });
		input.readText.mockResolvedValue('{"uid":"dash-1","title":"New"}');
		const run = await operation('update', 'dashboard').prepare(input);
		await run(client, {});
		expect(client.updateDashboard).toHaveBeenCalledWith(
			{ dashboard: { uid: 'dash-1', title: 'New' }, folderUid: undefined, message: undefined, overwrite: false, dryRun: true },
			{},
		);
	});

	it('allows a panel patch dry-run without --yes and marks it in the service call', async () => {
		const client = { patchPanel: vi.fn(async () => ({ status: 'success' })) } as unknown as IGrafanaService;
		const run = await operation('patch', 'panel').prepare(context(['my-dashboard/3'], { 'dry-run': true, set: 'title=CPU' }));
		await run(client, {});
		expect(client.patchPanel).toHaveBeenCalledWith(
			{ dashboardUid: 'my-dashboard', panelId: 3, set: { title: 'CPU' }, merge: undefined, replace: undefined, message: undefined, dryRun: true },
			{},
		);
	});

	it('marks only dashboard update and panel patch as supporting dry-run', () => {
		const supportsDryRun = (name: string, group?: string) => operation(name, group).supportsDryRun === true;
		expect(supportsDryRun('status')).toBe(false);
		expect(supportsDryRun('whoami')).toBe(false);
		expect(supportsDryRun('api')).toBe(false);
		expect(supportsDryRun('list', 'dashboard')).toBe(false);
		expect(supportsDryRun('get', 'dashboard')).toBe(false);
		expect(supportsDryRun('update', 'dashboard')).toBe(true);
		expect(supportsDryRun('get', 'panel')).toBe(false);
		expect(supportsDryRun('patch', 'panel')).toBe(true);
	});
});
