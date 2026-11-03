import { connectMcpServer as connect } from '@wener/client/mcp';
import { MCP_CLIENT_INFO } from '../const';
import type { WocliMcpHost } from '../createWocliCli';

export const connectMcpServer: WocliMcpHost['connect'] = (config, signal) =>
	connect(config, signal, { clientInfo: MCP_CLIENT_INFO });
