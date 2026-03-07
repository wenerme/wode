import { StreamableHTTPTransport } from '@hono/mcp';
import { type HttpBindings, serve } from '@hono/node-server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import consola from 'consola';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { MssqlResources } from '../MssqlResources';
import { MssqlTools } from '../MssqlTools';
import { getMssqlConfig } from './config';
import { type ConnectionPool, createConnectionPool } from './connection';

export interface MssqlMcpServerConfig {
	port?: number;
	host?: string;
	stdio?: boolean;
}

const serverLogger = consola.withTag('mssql-mcp-server');

export class MssqlMcpServer {
	private server: Server;
	private app?: Hono<any>;
	private httpServer?: any;
	private pool?: ConnectionPool;
	private config: Required<MssqlMcpServerConfig>;

	constructor(config: MssqlMcpServerConfig = {}) {
		this.config = {
			port: config.port ?? 3003,
			host: config.host ?? 'localhost',
			stdio: config.stdio ?? false,
		};

		// Create MCP server using original SDK approach
		this.server = new Server(
			{
				name: 'mssql-mcp-server',
				version: '1.0.0',
			},
			{
				capabilities: {
					tools: {},
					resources: {},
				},
			},
		);

		this.setupHandlers();
	}

	private setupHandlers() {
		// Tool handlers
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			const tools = MssqlTools.getToolDefinitions();
			return { tools };
		});

		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			if (!this.pool) {
				throw new Error('Database connection not initialized');
			}

			const { name, arguments: args } = request.params;
			return await MssqlTools.handleTool(name, args, this.pool);
		});

		// Resource handlers
		this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
			if (!this.pool) {
				throw new Error('Database connection not initialized');
			}

			const resources = await MssqlResources.getResourceDefinitions(this.pool);
			return { resources };
		});

		this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
			if (!this.pool) {
				throw new Error('Database connection not initialized');
			}

			const { uri } = request.params;
			const contents = await MssqlResources.handleResource(uri, this.pool);
			return { contents: [contents] };
		});
	}

	async start() {
		// Initialize database configuration and connection pool
		const dbConfig = getMssqlConfig();

		this.pool = createConnectionPool(dbConfig);

		// Test the connection
		try {
			await this.pool.query('SELECT 1 AS test');
			if (!this.config.stdio) {
				serverLogger.success('Database connection established successfully');
			}
		} catch (error) {
			if (!this.config.stdio) {
				serverLogger.error('Failed to connect to database:', error);
			}
			throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}

		if (this.config.stdio) {
			// STDIO transport for CLI usage
			const transport = new StdioServerTransport();
			await this.server.connect(transport);
		} else {
			// HTTP transport with Hono following the reference pattern
			this.app = new Hono<{
				Bindings: HttpBindings;
			}>();

			this.app.use(logger());

			// CORS configuration
			this.app.use(
				'*',
				cors({
					origin: ['https://claude.ai'],
					allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
					allowHeaders: ['Content-Type', 'Authorization'],
				}),
			);

			// Health check endpoint
			this.app.get('/health', (c) => {
				return c.json({
					status: 'healthy',
					timestamp: new Date().toISOString(),
					service: 'mssql-mcp-server',
					version: '1.0.0',
				});
			});

			this.app.all('/mcp', async (c) => {
				const transport = new StreamableHTTPTransport();
				await this.server.connect(transport);
				return transport.handleRequest(c);
			});

			// Start HTTP server
			this.httpServer = serve({
				fetch: this.app.fetch,
				port: this.config.port,
				hostname: this.config.host,
			});

			serverLogger.info(`MSSQL MCP server started on http://${this.config.host}:${this.config.port}`);
		}
	}

	async stop() {
		if (this.httpServer) {
			this.httpServer.close();
			if (!this.config.stdio) {
				serverLogger.info('HTTP server stopped');
			}
		}

		if (this.server) {
			await this.server.close();
			if (!this.config.stdio) {
				serverLogger.info('MCP server stopped');
			}
		}

		if (this.pool) {
			await this.pool.close();
			if (!this.config.stdio) {
				serverLogger.info('Database connection pool closed');
			}
		}
	}
}
