import { connectMcpServer as connect } from '@wener/client/mcp';
import { MCP_CLIENT_INFO } from '../const';
import type { CliMcpHost } from '../createCli';

export const connectMcpServer: CliMcpHost['connect'] = (config, signal) =>
	connect(config, signal, { clientInfo: MCP_CLIENT_INFO });
