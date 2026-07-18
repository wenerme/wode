import { ChevronDown, ChevronUp, RefreshCw, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, NavLink, Route, Routes } from 'react-router';
import type { AuditEvent } from '../contracts';
import type { ModelInfo, RequestStats, ServerInfo, ServerTypeInfo, ServiceOverview } from '../contracts/McpsContract';
import { ChatPage } from './ChatPage';
import { McpInspectorPage } from './McpInspectorPage';
import './styles.css';

// Simple API client using fetch
export const api = {
	async overview(): Promise<ServiceOverview> {
		const res = await fetch('/api/mcps/overview');
		return res.json();
	},
	async stats(params: { from?: string; to?: string } = {}): Promise<RequestStats> {
		const url = new URL('/api/mcps/stats', window.location.origin);
		if (params.from) url.searchParams.set('from', params.from);
		if (params.to) url.searchParams.set('to', params.to);
		const res = await fetch(url);
		return res.json();
	},
	async auditList(params: { limit?: number } = {}): Promise<{ events: AuditEvent[]; total: number }> {
		const url = new URL('/api/audit', window.location.origin);
		if (params.limit) url.searchParams.set('limit', String(params.limit));
		const res = await fetch(url);
		return res.json();
	},
	async servers(): Promise<{ servers: ServerInfo[] }> {
		const res = await fetch('/api/mcps/servers');
		return res.json();
	},
	async models(): Promise<{ models: ModelInfo[] }> {
		const res = await fetch('/api/mcps/models');
		return res.json();
	},
	async healthCheck(model: string): Promise<{ ok: boolean; error?: string; durationMs?: number }> {
		const start = Date.now();
		try {
			const res = await fetch('/v1/chat/completions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model,
					messages: [{ role: 'user', content: 'hello' }],
					max_tokens: 10,
				}),
			});
			const durationMs = Date.now() - start;
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				return { ok: false, error: data.error?.message || `HTTP ${res.status}`, durationMs };
			}
			return { ok: true, durationMs };
		} catch (e) {
			return { ok: false, error: e instanceof Error ? e.message : 'Unknown error', durationMs: Date.now() - start };
		}
	},
};

function getServerTypeBadgeClass(type: string) {
	const classes: Record<string, string> = {
		'tencent-cls': 'badge-info',
		sql: 'badge-success',
		prometheus: 'badge-secondary',
		relay: 'badge-warning',
	};
	return classes[type] || 'badge-primary';
}

// Header hints for each server type
const serverTypeHeaders: Record<string, { required: string[]; optional?: string[] }> = {
	'tencent-cls': {
		required: ['X-CLS-SECRET-ID', 'X-CLS-SECRET-KEY', 'X-CLS-REGION'],
		optional: ['X-CLS-ENDPOINT'],
	},
	sql: {
		required: ['X-DB-URL'],
		optional: ['X-DB-READ-URL', 'X-DB-WRITE-URL'],
	},
	prometheus: {
		required: ['X-SERVICE-URL'],
	},
	relay: {
		required: ['X-MCP-URL'],
		optional: ['X-MCP-TYPE', 'X-MCP-COMMAND'],
	},
};

function ServerTypeCard({ serverType }: { serverType: ServerTypeInfo }) {
	const headers = serverTypeHeaders[serverType.type];
	return (
		<div className='card bg-base-100 border-base-300 border shadow-sm'>
			<div className='card-body p-4'>
				<div className='mb-2 flex items-center gap-2'>
					<span className={`badge ${getServerTypeBadgeClass(serverType.type)}`}>{serverType.type}</span>
				</div>
				<p className='text-base-content/70 mb-2 text-sm'>{serverType.description}</p>
				<code className='bg-base-200 mb-2 block rounded px-2 py-1 text-xs'>{serverType.dynamicEndpoint}</code>
				{headers && (
					<div className='text-xs'>
						<div className='text-base-content/50 mb-1'>Headers:</div>
						<div className='flex flex-wrap gap-1'>
							{headers.required.map((h) => (
								<code key={h} className='bg-error/10 text-error rounded px-1'>
									{h}
								</code>
							))}
							{headers.optional?.map((h) => (
								<code key={h} className='bg-base-200 rounded px-1'>
									{h}
								</code>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function ServerCard({ server }: { server: ServerInfo }) {
	return (
		<div className='card bg-base-100 border-base-300 border shadow-sm'>
			<div className='card-body flex-row items-center justify-between p-4'>
				<div>
					<div className='text-base-content font-semibold'>{server.name}</div>
					<span className={`badge badge-sm ${getServerTypeBadgeClass(server.type)}`}>{server.type}</span>
				</div>
				{server.disabled && <span className='badge badge-error badge-sm'>disabled</span>}
			</div>
		</div>
	);
}

function ModelCard({ model }: { model: ModelInfo }) {
	const [checking, setChecking] = useState(false);
	const [result, setResult] = useState<{ ok: boolean; error?: string; durationMs?: number } | null>(null);

	const handleCheck = async () => {
		setChecking(true);
		setResult(null);
		const res = await api.healthCheck(model.name);
		setResult(res);
		setChecking(false);
	};

	return (
		<div className='card bg-base-100 border-base-300 border shadow-sm'>
			<div className='card-body p-4'>
				<div className='flex items-start justify-between'>
					<div className='text-base-content mb-2 font-semibold'>{model.name}</div>
					<button
						type='button'
						className='btn btn-xs btn-ghost'
						onClick={handleCheck}
						disabled={checking}
						title='Health check'
					>
						{checking ? <span className='loading loading-spinner loading-xs' /> : <Stethoscope className='h-4 w-4' />}
					</button>
				</div>
				<div className='flex flex-wrap gap-2'>
					{model.adapter && <span className='badge badge-secondary badge-sm'>{model.adapter}</span>}
					{model.baseUrl && (
						<span className='text-base-content/50 max-w-48 truncate text-xs' title={model.baseUrl}>
							{model.baseUrl}
						</span>
					)}
				</div>
				{result && (
					<div className={`mt-2 text-xs ${result.ok ? 'text-success' : 'text-error'}`}>
						{result.ok ? `✓ OK (${result.durationMs}ms)` : `✗ ${result.error}`}
					</div>
				)}
			</div>
		</div>
	);
}

// Overview Page
function OverviewPage() {
	const [overview, setOverview] = useState<ServiceOverview | null>(null);
	const [stats, setStats] = useState<RequestStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([api.overview(), api.stats()])
			.then(([o, s]) => {
				setOverview(o);
				setStats(s);
			})
			.finally(() => setLoading(false));
	}, []);

	if (loading) return <div className='loading loading-spinner loading-lg mx-auto' />;

	return (
		<div className='space-y-6'>
			{/* Stats Cards */}
			<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
				<div className='stat bg-base-100 rounded-box border-base-300 border shadow-sm'>
					<div className='stat-value text-2xl'>{overview?.servers.length ?? 0}</div>
					<div className='stat-desc'>Configured Servers</div>
				</div>
				<div className='stat bg-base-100 rounded-box border-base-300 border shadow-sm'>
					<div className='stat-value text-2xl'>{overview?.models.length ?? 0}</div>
					<div className='stat-desc'>Model Configs</div>
				</div>
				<div className='stat bg-base-100 rounded-box border-base-300 border shadow-sm'>
					<div className='stat-value text-2xl'>{stats?.totalRequests ?? 0}</div>
					<div className='stat-desc'>Total Requests</div>
				</div>
				<div className='stat bg-base-100 rounded-box border-base-300 border shadow-sm'>
					<div className={`stat-value text-2xl ${(stats?.totalErrors ?? 0) > 0 ? 'text-error' : ''}`}>
						{stats?.totalErrors ?? 0}
					</div>
					<div className='stat-desc'>Errors</div>
				</div>
			</div>

			{/* Supported Server Types */}
			<div>
				<h2 className='text-base-content mb-3 text-lg font-semibold'>Supported Server Types</h2>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
					{overview?.serverTypes.map((st) => (
						<ServerTypeCard key={st.type} serverType={st} />
					))}
				</div>
				<div className='text-base-content/50 mt-3 text-sm'>
					<span className='font-medium'>Common Headers:</span>{' '}
					<code className='bg-base-200 rounded px-1'>X-MCP-Readonly</code> (TRUE = only readonly tools){' '}
					<code className='bg-base-200 rounded px-1'>X-MCP-Include</code>{' '}
					<code className='bg-base-200 rounded px-1'>X-MCP-Exclude</code> (glob patterns for tool filtering)
				</div>
			</div>

			{/* Configured Servers Preview */}
			{overview && overview.servers.length > 0 && (
				<div>
					<h2 className='text-base-content mb-3 text-lg font-semibold'>
						Configured Servers ({overview.servers.length})
					</h2>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						{overview.servers.slice(0, 4).map((s) => (
							<ServerCard key={s.name} server={s} />
						))}
					</div>
					{overview.servers.length > 4 && (
						<div className='mt-4 text-center'>
							<NavLink to='/servers' className='btn btn-ghost btn-sm'>
								View all {overview.servers.length} servers →
							</NavLink>
						</div>
					)}
				</div>
			)}

			{/* Request Stats by Method */}
			{stats && stats.byMethod.length > 0 && (
				<div>
					<h2 className='text-base-content mb-3 text-lg font-semibold'>Requests by Method</h2>
					<div className='bg-base-100 rounded-box border-base-300 overflow-x-auto border shadow-sm'>
						<table className='table-zebra table'>
							<thead>
								<tr>
									<th>Method</th>
									<th>Count</th>
								</tr>
							</thead>
							<tbody>
								{stats.byMethod.map((item) => (
									<tr key={item.method}>
										<td>
											<span className='badge badge-info badge-sm'>{item.method}</span>
										</td>
										<td>{item.count}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}

// Servers Page
function ServersPage() {
	const [servers, setServers] = useState<ServerInfo[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api.servers().then((data) => {
			setServers(data.servers);
			setLoading(false);
		});
	}, []);

	if (loading) return <div className='loading loading-spinner loading-lg mx-auto' />;

	return (
		<div>
			<h2 className='text-base-content mb-3 text-lg font-semibold'>Configured Servers ({servers.length})</h2>
			{servers.length > 0 ? (
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					{servers.map((s) => (
						<ServerCard key={s.name} server={s} />
					))}
				</div>
			) : (
				<div className='card bg-base-100 border-base-300 border shadow-sm'>
					<div className='card-body text-base-content/50 text-center'>No servers configured</div>
				</div>
			)}
		</div>
	);
}

// Models Page
function ModelsPage() {
	const [models, setModels] = useState<ModelInfo[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api.models().then((data) => {
			setModels(data.models);
			setLoading(false);
		});
	}, []);

	if (loading) return <div className='loading loading-spinner loading-lg mx-auto' />;

	return (
		<div>
			<h2 className='text-base-content mb-3 text-lg font-semibold'>Model Configurations ({models.length})</h2>
			{models.length > 0 ? (
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					{models.map((m) => (
						<ModelCard key={m.name} model={m} />
					))}
				</div>
			) : (
				<div className='card bg-base-100 border-base-300 border shadow-sm'>
					<div className='card-body text-base-content/50 text-center'>No models configured</div>
				</div>
			)}
		</div>
	);
}

// Log Row with expand support
function LogRow({ event }: { event: AuditEvent }) {
	const [isExpanded, setIsExpanded] = useState(false);

	const hasDetails = event.requestBody || event.responseBody || event.requestHeaders;

	return (
		<>
			<tr className='hover'>
				<td className='text-xs'>{new Date(event.timestamp).toLocaleTimeString()}</td>
				<td>
					<span className='badge badge-info badge-xs'>{event.method}</span>
				</td>
				<td>
					<code className='block max-w-48 truncate text-xs' title={event.path}>
						{event.path}
					</code>
				</td>
				<td className='text-xs'>{event.serverName || event.serverType || '-'}</td>
				<td>
					<span className={event.status && event.status >= 400 ? 'text-error' : 'text-success'}>
						{event.status || '-'}
					</span>
				</td>
				<td className='text-xs'>{event.durationMs != null ? `${event.durationMs}ms` : '-'}</td>
				<td>
					{hasDetails && (
						<button type='button' className='btn btn-ghost btn-xs' onClick={() => setIsExpanded(!isExpanded)}>
							{isExpanded ? <ChevronUp className='h-3 w-3' /> : <ChevronDown className='h-3 w-3' />}
						</button>
					)}
				</td>
			</tr>
			{isExpanded && hasDetails && (
				<tr>
					<td colSpan={7} className='bg-base-200 p-3'>
						<div className='space-y-2 text-xs'>
							{event.requestHeaders && (
								<div>
									<div className='mb-1 font-semibold'>Request Headers:</div>
									<pre className='bg-base-100 max-h-24 overflow-auto rounded p-2'>
										{JSON.stringify(event.requestHeaders, null, 2)}
									</pre>
								</div>
							)}
							{event.requestBody != null && (
								<div>
									<div className='mb-1 font-semibold'>Request Body:</div>
									<pre className='bg-base-100 max-h-48 overflow-auto rounded p-2'>
										{typeof event.requestBody === 'string'
											? event.requestBody
											: JSON.stringify(event.requestBody as object, null, 2)}
									</pre>
								</div>
							)}
							{event.responseBody != null && (
								<div>
									<div className='mb-1 font-semibold'>Response Body:</div>
									<pre className='bg-base-100 max-h-48 overflow-auto rounded p-2'>
										{typeof event.responseBody === 'string'
											? event.responseBody
											: JSON.stringify(event.responseBody as object, null, 2)}
									</pre>
								</div>
							)}
							{event.error && (
								<div>
									<div className='text-error mb-1 font-semibold'>Error:</div>
									<pre className='bg-error/10 text-error rounded p-2'>{event.error}</pre>
								</div>
							)}
						</div>
					</td>
				</tr>
			)}
		</>
	);
}

// Logs Page (renamed from Audit)
function LogsPage() {
	const [events, setEvents] = useState<AuditEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState<'all' | 'mcp' | 'chat'>('all');

	const fetchLogs = () => {
		setLoading(true);
		api.auditList({ limit: 200 }).then((data) => {
			setEvents(data.events);
			setLoading(false);
		});
	};

	useEffect(() => {
		fetchLogs();
		const interval = setInterval(fetchLogs, 5000);
		return () => clearInterval(interval);
	}, []);

	const mcpLogs = events.filter((e) => e.path.startsWith('/mcp/'));
	const chatLogs = events.filter((e) => e.path.startsWith('/v1/'));
	const allLogs = events;
	const currentLogs = tab === 'all' ? allLogs : tab === 'mcp' ? mcpLogs : chatLogs;

	return (
		<div>
			<div className='mb-3 flex items-center justify-between'>
				<h2 className='text-base-content text-lg font-semibold'>Logs</h2>
				<button type='button' className='btn btn-ghost btn-sm gap-1' onClick={fetchLogs} disabled={loading}>
					{loading ? <span className='loading loading-spinner loading-xs' /> : <RefreshCw className='h-4 w-4' />}
					Refresh
				</button>
			</div>

			<div className='tabs tabs-boxed bg-base-100 mb-4 w-fit'>
				<button type='button' className={`tab ${tab === 'all' ? 'tab-active' : ''}`} onClick={() => setTab('all')}>
					All ({allLogs.length})
				</button>
				<button type='button' className={`tab ${tab === 'mcp' ? 'tab-active' : ''}`} onClick={() => setTab('mcp')}>
					MCP ({mcpLogs.length})
				</button>
				<button type='button' className={`tab ${tab === 'chat' ? 'tab-active' : ''}`} onClick={() => setTab('chat')}>
					Chat ({chatLogs.length})
				</button>
			</div>

			<div className='bg-base-100 rounded-box border-base-300 overflow-x-auto border shadow-sm'>
				<table className='table-zebra table-sm table'>
					<thead>
						<tr>
							<th>Time</th>
							<th>Method</th>
							<th>Path</th>
							<th>Server/Type</th>
							<th>Status</th>
							<th>Duration</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{currentLogs.map((event) => (
							<LogRow key={event.id} event={event} />
						))}
						{currentLogs.length === 0 && (
							<tr>
								<td colSpan={7} className='text-base-content/50 text-center'>
									No logs yet
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// Chat Page Wrapper
function ChatPageWrapper() {
	return (
		<div className='card bg-base-100 border-base-300 h-[calc(100vh-200px)] border shadow-sm'>
			<ChatPage />
		</div>
	);
}

// Inspector Page Wrapper
function InspectorPageWrapper() {
	return (
		<div className='card bg-base-100 border-base-300 h-[calc(100vh-200px)] border shadow-sm'>
			<McpInspectorPage />
		</div>
	);
}

// Layout
function Layout({ children }: { children: React.ReactNode }) {
	const [overview, setOverview] = useState<ServiceOverview | null>(null);

	useEffect(() => {
		api.overview().then(setOverview);
	}, []);

	return (
		<div className='bg-base-200 min-h-screen'>
			<div className='container mx-auto max-w-7xl p-4 md:p-6'>
				{/* Header */}
				<div className='mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
					<div>
						<h1 className='text-base-content text-2xl font-bold'>MCPS Dashboard</h1>
						<p className='text-base-content/60 text-sm'>
							{overview?.name} v{overview?.version}
						</p>
					</div>
				</div>

				{/* Navigation */}
				<nav className='tabs tabs-boxed bg-base-100 mb-6'>
					<NavLink to='/' end className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
						Overview
					</NavLink>
					<NavLink to='/servers' className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
						Servers
					</NavLink>
					<NavLink to='/models' className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
						Models
					</NavLink>
					<NavLink to='/logs' className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
						Logs
					</NavLink>
					<NavLink to='/chat' className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
						Chat
					</NavLink>
					<NavLink to='/inspector' className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
						Inspector
					</NavLink>
				</nav>

				{/* Content */}
				{children}
			</div>
		</div>
	);
}

function App() {
	return (
		<HashRouter>
			<Layout>
				<Routes>
					<Route path='/' element={<OverviewPage />} />
					<Route path='/servers' element={<ServersPage />} />
					<Route path='/models' element={<ModelsPage />} />
					<Route path='/logs' element={<LogsPage />} />
					<Route path='/chat' element={<ChatPageWrapper />} />
					<Route path='/inspector' element={<InspectorPageWrapper />} />
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</Layout>
		</HashRouter>
	);
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');
const root = createRoot(rootEl);
root.render(<App />);
