import { getAllMcpServerHandlerDefs, type McpServerHandlerDef } from './McpServerHandlerDef';
import './defs';

/**
 * Find MCP server definitions matching a predicate
 */
export function findMcpServerDef(predicate?: (def: McpServerHandlerDef) => boolean): McpServerHandlerDef[] {
	const all = getAllMcpServerHandlerDefs();
	if (!predicate) {
		return all;
	}
	return all.filter(predicate);
}

/**
 * Resolve a single MCP server definition by name
 */
export function resolveMcpServerDef(name: string): McpServerHandlerDef | undefined {
	return findMcpServerDef((v) => v.name === name)[0];
}

/**
 * Get total count of registered MCP server types
 */
export function getMcpServerDefCount(): number {
	return getAllMcpServerHandlerDefs().length;
}
