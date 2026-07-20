import { useCallback, useEffect, useState } from 'react';
import type { ServerInfo } from '../contracts';

interface McpTool {
	name: string;
	description?: string;
	inputSchema?: {
		type?: string;
		properties?: Record<string, { type?: string; description?: string }>;
		required?: string[];
	};
}

export function McpInspectorPage() {
	const [servers, setServers] = useState<ServerInfo[]>([]);
	const [selectedServer, setSelectedServer] = useState<string>('');
	const [tools, setTools] = useState<McpTool[]>([]);
	const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);
	const [toolInput, setToolInput] = useState('{}');
	const [toolResult, setToolResult] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [connecting, setConnecting] = useState(false);
	const [executing, setExecuting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch servers on mount
	useEffect(() => {
		fetch('/api/mcps/servers')
			.then((r) => r.json())
			.then((data) => setServers(data.servers || []))
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	// Connect to server when selected
	const connectServer = useCallback(async (serverName: string) => {
		if (!serverName) {
			setTools([]);
			setSelectedTool(null);
			setError(null);
			return;
		}

		setConnecting(true);
		setError(null);
		setTools([]);
		setSelectedTool(null);
		setToolResult(null);

		try {
			const res = await fetch(`/mcp/${serverName}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/list',
					params: {},
				}),
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error.message || 'Failed to list tools');
			}
			setTools(data.result?.tools || []);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Connection failed');
		} finally {
			setConnecting(false);
		}
	}, []);

	// Handle server selection
	const handleServerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const serverName = e.target.value;
		setSelectedServer(serverName);
		connectServer(serverName);
	};

	// Execute a tool
	const executeTool = useCallback(async () => {
		if (!selectedServer || !selectedTool) return;

		setExecuting(true);
		setToolResult(null);

		try {
			const args = JSON.parse(toolInput);

			const res = await fetch(`/mcp/${selectedServer}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 2,
					method: 'tools/call',
					params: {
						name: selectedTool.name,
						arguments: args,
					},
				}),
			});

			const data = await res.json();
			setToolResult(JSON.stringify(data, null, 2));
		} catch (e) {
			setToolResult(`Error: ${e instanceof Error ? e.message : 'Execution failed'}`);
		} finally {
			setExecuting(false);
		}
	}, [selectedServer, selectedTool, toolInput]);

	// Generate default input from schema
	const generateDefaultInput = useCallback((tool: McpTool) => {
		if (!tool.inputSchema?.properties) return '{}';
		const defaultObj: Record<string, unknown> = {};
		for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
			if (prop.type === 'string') defaultObj[key] = '';
			else if (prop.type === 'number' || prop.type === 'integer') defaultObj[key] = 0;
			else if (prop.type === 'boolean') defaultObj[key] = false;
			else if (prop.type === 'array') defaultObj[key] = [];
			else if (prop.type === 'object') defaultObj[key] = {};
		}
		return JSON.stringify(defaultObj, null, 2);
	}, []);

	// Handle tool selection
	const handleToolSelect = (tool: McpTool) => {
		setSelectedTool(tool);
		setToolInput(generateDefaultInput(tool));
		setToolResult(null);
	};

	if (loading) {
		return (
			<div className='flex justify-center items-center p-8'>
				<span className='loading loading-spinner loading-lg' />
			</div>
		);
	}

	return (
		<div className='flex flex-col h-full min-h-[600px]'>
			{/* Header with server dropdown */}
			<div className='p-3 border-b border-base-300 bg-base-100 flex items-center gap-4'>
				<h3 className='font-semibold'>MCP Inspector</h3>
				<select className='select select-bordered select-sm w-64' value={selectedServer} onChange={handleServerChange}>
					<option value=''>Select a server...</option>
					{servers.map((server) => (
						<option key={server.name} value={server.name}>
							{server.name} ({server.type})
						</option>
					))}
				</select>
				{connecting && <span className='loading loading-spinner loading-sm' />}
				{error && <span className='text-error text-sm'>{error}</span>}
			</div>

			{/* Main content */}
			<div className='flex flex-1 overflow-hidden'>
				{/* Tools List */}
				<div className='w-64 border-r border-base-300 bg-base-100 flex flex-col flex-shrink-0'>
					<div className='p-3 border-b border-base-300'>
						<h4 className='font-medium text-sm'>Tools {tools.length > 0 && `(${tools.length})`}</h4>
					</div>
					<div className='flex-1 overflow-y-auto'>
						{!selectedServer ? (
							<div className='p-4 text-center text-base-content/50 text-sm'>Select a server above</div>
						) : tools.length === 0 && !connecting ? (
							<div className='p-4 text-center text-base-content/50 text-sm'>No tools available</div>
						) : (
							<ul className='menu p-2 gap-1'>
								{tools.map((tool) => (
									<li key={tool.name}>
										<button
											type='button'
											className={`flex flex-col items-start text-left ${selectedTool?.name === tool.name ? 'active' : ''}`}
											onClick={() => handleToolSelect(tool)}
										>
											<span className='font-mono text-xs'>{tool.name}</span>
											{tool.description && (
												<span className='text-xs text-base-content/50 truncate w-full'>{tool.description}</span>
											)}
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				{/* Tool Execution Panel */}
				<div className='flex-1 flex flex-col overflow-hidden'>
					{!selectedTool ? (
						<div className='flex-1 flex items-center justify-center text-base-content/50'>Select a tool to execute</div>
					) : (
						<>
							{/* Tool info */}
							<div className='p-4 border-b border-base-300 bg-base-100'>
								<h3 className='font-semibold mb-2'>{selectedTool.name}</h3>
								{selectedTool.description && <p className='text-sm mb-3'>{selectedTool.description}</p>}
								{selectedTool.inputSchema?.properties && (
									<div className='text-xs text-base-content/70'>
										<strong>Parameters:</strong>
										<ul className='ml-4 mt-1 space-y-0.5'>
											{Object.entries(selectedTool.inputSchema.properties).map(([name, prop]) => (
												<li key={name}>
													<code className='bg-base-200 px-1 rounded'>{name}</code>
													<span className='ml-1 text-base-content/50'>({prop.type || 'any'})</span>
													{selectedTool.inputSchema?.required?.includes(name) && (
														<span className='text-error ml-1'>*</span>
													)}
													{prop.description && <span className='ml-2 text-base-content/60'>- {prop.description}</span>}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>

							{/* Input */}
							<div className='p-4 border-b border-base-300 bg-base-200'>
								<label className='text-sm font-medium mb-2 block'>Arguments (JSON):</label>
								<textarea
									className='textarea textarea-bordered w-full font-mono text-xs'
									rows={5}
									value={toolInput}
									onChange={(e) => setToolInput(e.target.value)}
								/>
								<button
									type='button'
									className='btn btn-primary btn-sm mt-2'
									onClick={executeTool}
									disabled={executing}
								>
									{executing ? <span className='loading loading-spinner loading-sm' /> : 'Execute'}
								</button>
							</div>

							{/* Result */}
							<div className='flex-1 overflow-auto p-4 bg-base-200'>
								<label className='text-sm font-medium mb-2 block'>Result:</label>
								<pre className='bg-base-100 p-4 rounded-box text-xs overflow-auto max-h-[400px] border border-base-300'>
									{toolResult || 'No result yet'}
								</pre>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
