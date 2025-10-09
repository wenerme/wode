import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createKnexSqlServiceImpl } from './createKnexSqlServiceImpl';

// Mock Knex
const mockKnex = {
	raw: vi.fn(),
	client: {
		config: {
			client: 'mysql2'
		}
	}
} as any;

describe('createKnexSqlServiceImpl', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should create service implementation', () => {
		const service = createKnexSqlServiceImpl(mockKnex);
		
		expect(service).toBeDefined();
		expect(service.queryCsv).toBeDefined();
		expect(service.queryJson).toBeDefined();
		expect(service.executeSql).toBeDefined();
		expect(service.executeDml).toBeDefined();
		expect(service.executeDdl).toBeDefined();
		expect(service.getVersion).toBeDefined();
		expect(service.listObjects).toBeDefined();
		expect(service.describeObject).toBeDefined();
	});

	it('should handle queryCsv', async () => {
		const mockRows = [
			{ id: 1, name: 'test' },
			{ id: 2, name: 'test2' }
		];
		mockKnex.raw.mockResolvedValue(mockRows);

		const service = createKnexSqlServiceImpl(mockKnex);
		const result = await service.queryCsv!({ query: 'SELECT * FROM test' });

		expect(result).toEqual({
			content: [{
				type: 'text',
				text: 'id,name\n1,test\n2,test2'
			}]
		});
	});

	it('should handle queryJson', async () => {
		const mockRows = [
			{ id: 1, name: 'test' },
			{ id: 2, name: 'test2' }
		];
		mockKnex.raw.mockResolvedValue(mockRows);

		const service = createKnexSqlServiceImpl(mockKnex);
		const result = await service.queryJson!({ query: 'SELECT * FROM test' });

		expect(result).toEqual({
			content: [{
				type: 'text',
				text: JSON.stringify(mockRows, null, 2)
			}]
		});
	});

	it('should handle getVersion', async () => {
		mockKnex.raw.mockResolvedValue([{ version: '8.0.0' }]);

		const service = createKnexSqlServiceImpl(mockKnex);
		const result = await service.getVersion!();

		expect(result).toEqual({
			version: '8.0.0',
			type: 'MySQL'
		});
	});

	it('should respect read-only mode', async () => {
		const service = createKnexSqlServiceImpl(mockKnex, { readOnly: true });

		await expect(service.executeDml!({ query: 'INSERT INTO test VALUES (1)' }))
			.rejects.toThrow('DML operations are not allowed in read-only mode');

		await expect(service.executeDdl!({ query: 'CREATE TABLE test (id INT)' }))
			.rejects.toThrow('DDL operations are not allowed in read-only mode');
	});

	it('should handle maxRows limit', async () => {
		const mockRows = Array.from({ length: 10 }, (_, i) => ({ id: i }));
		mockKnex.raw.mockResolvedValue(mockRows);

		const service = createKnexSqlServiceImpl(mockKnex, { maxRows: 5 });
		const result = await service.executeSql!({ query: 'SELECT * FROM test' });

		expect(result.rows).toHaveLength(5);
		expect(result.total).toBe(10);
	});
});