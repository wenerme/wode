import { useEffect, useState } from 'react';
import type { ServerInfo, ToolInfo } from '../contracts';

export function ServersPage() {
	const [servers, setServers] = useState<ServerInfo[]>([]);
	const [tools, setTools] = useState<ToolInfo[]>([]);
	const [selectedServer, setSelectedServer] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		Promise.all([fetch('/api/mcps/servers').then((r) => r.json()), fetch('/api/mcps/tools').then((r) => r.json())])
			.then(([serversData, toolsData]) => {
				setServers(serversData.servers || []);
				setTools(toolsData.tools || []);
			})
			.catch((e) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

	const filteredTools = selectedServer ? tools.filter((t) => t.serverName === selectedServer) : tools;

	if (loading) {
		return (
			<div className='flex items-center justify-center p-8'>
				<span className='loading loading-spinner loading-lg' />
			</div>
		);
	}

	if (error) {
		return (
			<div className='alert alert-error'>
				<span>{error}</span>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Server List */}
			<div>
				<h2 className='mb-3 text-lg font-semibold'>MCP Servers ({servers.length})</h2>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{servers.map((server) => (
						<div
							key={server.name}
							className={`card bg-base-100 cursor-pointer border shadow-sm transition-all ${
								selectedServer === server.name ? 'border-primary ring-primary/30 ring-2' : 'border-base-300'
							}`}
							onClick={() => setSelectedServer(selectedServer === server.name ? null : server.name)}
							onKeyDown={(e) =>
								e.key === 'Enter' && setSelectedServer(selectedServer === server.name ? null : server.name)
							}
							role='button'
							tabIndex={0}
						>
							<div className='card-body p-4'>
								<div className='flex items-start justify-between'>
									<div>
										<div className='font-semibold'>{server.name}</div>
										<span className={`badge badge-sm ${getServerTypeBadgeClass(server.type)}`}>{server.type}</span>
									</div>
									{server.disabled && <span className='badge badge-error badge-sm'>disabled</span>}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Tools List */}
			<div>
				<div className='mb-3 flex items-center justify-between'>
					<h2 className='text-lg font-semibold'>
						Tools {selectedServer ? `(${selectedServer})` : ''} ({filteredTools.length})
					</h2>
					{selectedServer && (
						<button type='button' className='btn btn-ghost btn-xs' onClick={() => setSelectedServer(null)}>
							Show all
						</button>
					)}
				</div>

				{filteredTools.length === 0 ? (
					<div className='card bg-base-100 border-base-300 border shadow-sm'>
						<div className='card-body text-base-content/50 text-center'>
							<p>No tools available.</p>
							<p className='text-sm'>
								Tools will appear here when MCP servers are connected and their tools are listed.
							</p>
						</div>
					</div>
				) : (
					<div className='bg-base-100 rounded-box border-base-300 overflow-x-auto border shadow-sm'>
						<table className='table-zebra table'>
							<thead>
								<tr>
									<th>Tool</th>
									<th>Server</th>
									<th>Description</th>
									<th>Schema</th>
								</tr>
							</thead>
							<tbody>
								{filteredTools.map((tool) => (
									<tr key={`${tool.serverName}/${tool.name}`}>
										<td>
											<span className='font-mono text-sm'>{tool.name}</span>
										</td>
										<td>
											<span className='badge badge-sm'>{tool.serverName}</span>
										</td>
										<td className='text-base-content/70 text-sm'>{tool.description || '-'}</td>
										<td>
											{tool.inputSchemaCompact && (
												<code className='bg-base-200 rounded px-1 py-0.5 text-xs'>{tool.inputSchemaCompact}</code>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

function getServerTypeBadgeClass(type: string) {
	const classes: Record<string, string> = {
		'tencent-cls': 'badge-info',
		sql: 'badge-success',
		prometheus: 'badge-secondary',
		relay: 'badge-warning',
	};
	return classes[type] || 'badge-primary';
}
