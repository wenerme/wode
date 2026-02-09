import type { StreamableHTTPTransport } from '@hono/mcp';
import consola from 'consola';
import { HeaderNames } from './schema';

const mcpLog = consola.withTag('mcp');

/**
 * Tool annotation filter options
 */
export interface ToolFilterOptions {
	/** Only include tools with readOnlyHint: true */
	readonlyOnly?: boolean;
	/** Include patterns (glob) */
	includePatterns?: string[];
	/** Exclude patterns (glob) */
	excludePatterns?: string[];
}

/**
 * Check if a pattern matches a string (simple glob support)
 */
function matchPattern(pattern: string, value: string): boolean {
	// Convert glob to regex
	const regex = new RegExp(`^${pattern.replace(/\*/g, '.*').replace(/\?/g, '.')}$`, 'i');
	return regex.test(value);
}

/**
 * Filter tools based on filter options
 */
export function filterTools(tools: any[], options: ToolFilterOptions): any[] {
	let filtered = tools;

	// Filter by readonly annotation
	if (options.readonlyOnly) {
		filtered = filtered.filter((tool) => {
			const readOnlyHint = tool.annotations?.readOnlyHint;
			return readOnlyHint === true;
		});
	}

	// Filter by include patterns
	if (options.includePatterns && options.includePatterns.length > 0) {
		filtered = filtered.filter((tool) => options.includePatterns?.some((pattern) => matchPattern(pattern, tool.name)));
	}

	// Filter by exclude patterns
	if (options.excludePatterns && options.excludePatterns.length > 0) {
		filtered = filtered.filter((tool) => !options.excludePatterns?.some((pattern) => matchPattern(pattern, tool.name)));
	}

	return filtered;
}

/**
 * Create a logging and filtering wrapper for MCP transport
 * - Logs tool calls and their results with duration
 * - Filters tools/list response based on X-MCP-Readonly, X-MCP-Include, X-MCP-Exclude headers
 */
export function createMcpLoggingHandler(transport: StreamableHTTPTransport, serverName: string) {
	const originalHandleRequest = transport.handleRequest.bind(transport);

	return async (c: Parameters<typeof transport.handleRequest>[0]) => {
		const startTime = Date.now();

		// Get filter headers
		const readonlyHeader = c.req.header(HeaderNames.MCP_READONLY);
		const includeHeader = c.req.header(HeaderNames.MCP_INCLUDE);
		const excludeHeader = c.req.header(HeaderNames.MCP_EXCLUDE);

		const filterOptions: ToolFilterOptions = {};
		if (readonlyHeader?.toLowerCase() === 'true') {
			filterOptions.readonlyOnly = true;
		}
		if (includeHeader) {
			filterOptions.includePatterns = includeHeader.split(',').map((p) => p.trim());
		}
		if (excludeHeader) {
			filterOptions.excludePatterns = excludeHeader.split(',').map((p) => p.trim());
		}

		const needsFiltering = filterOptions.readonlyOnly || filterOptions.includePatterns || filterOptions.excludePatterns;

		// Log incoming request (clone body to avoid consuming it)
		const contentType = c.req.header('content-type');
		const isPost = c.req.method === 'POST';
		let isToolsList = false;
		let isToolsCall = false;
		let toolName = '';
		let parsedBody: any;

		if (isPost && contentType?.includes('application/json')) {
			try {
				// Clone the request to read body without consuming it
				const clonedReq = c.req.raw.clone();
				parsedBody = await clonedReq.json();
				// JSON-RPC request
				if (parsedBody.method === 'tools/call' && parsedBody.params) {
					const { name, arguments: args } = parsedBody.params;
					toolName = name;
					isToolsCall = true;
					mcpLog.info(`→ [${serverName}] tools/call: ${name}`, args ? JSON.stringify(args).slice(0, 200) : '');
				} else if (parsedBody.method === 'tools/list') {
					mcpLog.debug(`→ [${serverName}] tools/list`);
					isToolsList = true;
				} else if (parsedBody.method) {
					mcpLog.debug(`→ [${serverName}] ${parsedBody.method}`);
				}
			} catch {
				// Ignore parse errors, let the transport handle them
			}
		}

		// Call original handler with error handling
		let response: Response | undefined;
		try {
			response = await originalHandleRequest(c);
		} catch (e) {
			const duration = Date.now() - startTime;
			mcpLog.error(`✗ [${serverName}] handler error (${duration}ms):`, e);
			throw e;
		}

		// For tools/call, we need to wait for the SSE stream to complete to get accurate duration
		// Clone the response to read it without consuming the original
		if (isToolsCall && response instanceof Response) {
			const clonedResponse = response.clone();
			// Read the cloned response in the background to measure actual duration
			clonedResponse
				.text()
				.then(() => {
					const duration = Date.now() - startTime;
					mcpLog.info(`← [${serverName}] tools/call: ${toolName} (${duration}ms)`);
				})
				.catch(() => {
					// Ignore read errors
				});
		}

		// If this is a tools/list response and we need filtering, intercept and modify
		if (isToolsList && needsFiltering && response instanceof Response) {
			try {
				const responseText = await response.clone().text();
				const contentTypeHeader = response.headers.get('content-type') || '';

				// Handle SSE format (event: message\ndata: {...})
				if (contentTypeHeader.includes('text/event-stream')) {
					// Parse SSE data - find the data line
					const lines = responseText.split('\n');
					let jsonData = '';
					for (const line of lines) {
						if (line.startsWith('data: ')) {
							jsonData = line.slice(6);
							break;
						}
					}

					if (jsonData) {
						const responseData = JSON.parse(jsonData);

						if (responseData.result?.tools && Array.isArray(responseData.result.tools)) {
							const originalCount = responseData.result.tools.length;
							responseData.result.tools = filterTools(responseData.result.tools, filterOptions);
							const filteredCount = responseData.result.tools.length;

							if (filteredCount !== originalCount) {
								mcpLog.info(
									`← [${serverName}] tools/list: filtered ${originalCount} → ${filteredCount} tools (readonly=${filterOptions.readonlyOnly || false})`,
								);
							}

							// Return new SSE response with filtered tools
							const newSseData = `event: message\ndata: ${JSON.stringify(responseData)}\n\n`;
							return new Response(newSseData, {
								status: response.status,
								headers: response.headers,
							});
						}
					}
				} else {
					// Handle plain JSON response
					const responseData = JSON.parse(responseText);

					if (responseData.result?.tools && Array.isArray(responseData.result.tools)) {
						const originalCount = responseData.result.tools.length;
						responseData.result.tools = filterTools(responseData.result.tools, filterOptions);
						const filteredCount = responseData.result.tools.length;

						if (filteredCount !== originalCount) {
							mcpLog.info(
								`← [${serverName}] tools/list: filtered ${originalCount} → ${filteredCount} tools (readonly=${filterOptions.readonlyOnly || false})`,
							);
						}

						return new Response(JSON.stringify(responseData), {
							status: response.status,
							headers: response.headers,
						});
					}
				}
			} catch (e) {
				// If we can't parse/modify, return original
				mcpLog.warn(`[${serverName}] Failed to filter tools/list response: ${e instanceof Error ? e.message : e}`);
			}
		}

		return response;
	};
}
