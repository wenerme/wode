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
			<div className='flex items-center justify-center p-8'>
				<span className='loading loading-spinner loading-lg' />
			</div>
		);
	}

	return (
		<div className='flex h-full min-h-[600px] flex-col'>
			{/* Header with server dropdown */}
			<div className='border-base-300 bg-base-100 flex items-center gap-4 border-b p-3'>
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
				<div className='border-base-300 bg-base-100 flex w-64 flex-shrink-0 flex-col border-r'>
					<div className='border-base-300 border-b p-3'>
						<h4 className='text-sm font-medium'>Tools {tools.length > 0 && `(${tools.length})`}</h4>
					</div>
					<div className='flex-1 overflow-y-auto'>
						{!selectedServer ? (
							<div className='text-base-content/50 p-4 text-center text-sm'>Select a server above</div>
						) : tools.length === 0 && !connecting ? (
							<div className='text-base-content/50 p-4 text-center text-sm'>No tools available</div>
						) : (
							<ul className='menu gap-1 p-2'>
								{tools.map((tool) => (
									<li key={tool.name}>
										<button
											type='button'
											className={`flex flex-col items-start text-left ${selectedTool?.name === tool.name ? 'active' : ''}`}
											onClick={() => handleToolSelect(tool)}
										>
											<span className='font-mono text-xs'>{tool.name}</span>
											{tool.description && (
												<span className='text-base-content/50 w-full truncate text-xs'>{tool.description}</span>
											)}
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				{/* Tool Execution Panel */}
				<div className='flex flex-1 flex-col overflow-hidden'>
					{!selectedTool ? (
						<div className='text-base-content/50 flex flex-1 items-center justify-center'>Select a tool to execute</div>
					) : (
						<>
							{/* Tool info */}
							<div className='border-base-300 bg-base-100 border-b p-4'>
								<h3 className='mb-2 font-semibold'>{selectedTool.name}</h3>
								{selectedTool.description && <p className='mb-3 text-sm'>{selectedTool.description}</p>}
								{selectedTool.inputSchema?.properties && (
									<div className='text-base-content/70 text-xs'>
										<strong>Parameters:</strong>
										<ul className='mt-1 ml-4 space-y-0.5'>
											{Object.entries(selectedTool.inputSchema.properties).map(([name, prop]) => (
												<li key={name}>
													<code className='bg-base-200 rounded px-1'>{name}</code>
													<span className='text-base-content/50 ml-1'>({prop.type || 'any'})</span>
													{selectedTool.inputSchema?.required?.includes(name) && (
														<span className='text-error ml-1'>*</span>
													)}
													{prop.description && <span className='text-base-content/60 ml-2'>- {prop.description}</span>}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>

							{/* Input */}
							<div className='border-base-300 bg-base-200 border-b p-4'>
								<label className='mb-2 block text-sm font-medium'>Arguments (JSON):</label>
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
							<div className='bg-base-200 flex-1 overflow-auto p-4'>
								<label className='mb-2 block text-sm font-medium'>Result:</label>
								<pre className='bg-base-100 rounded-box border-base-300 max-h-[400px] overflow-auto border p-4 text-xs'>
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
