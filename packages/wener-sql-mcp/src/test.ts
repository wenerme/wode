// Simple test to verify the implementation compiles
import { createKnexSqlServiceImpl, createMcpServerHandler } from './index';

// Mock Knex instance for testing
const mockKnex = {
	raw: async () => [{ id: 1, name: 'test' }],
	client: {
		config: {
			client: 'mysql2'
		}
	}
} as any;

// Test service creation
const service = createKnexSqlServiceImpl(mockKnex);
console.log('Service created successfully:', Object.keys(service));

// Test MCP handler creation
const handler = createMcpServerHandler(mockKnex);
console.log('Handler created successfully:', Object.keys(handler));

export { service, handler };