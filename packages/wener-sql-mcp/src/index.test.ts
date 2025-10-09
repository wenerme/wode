import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWenerSqlMcpServer } from './index';
import knex from 'knex';

describe('WenerSqlMcpServer', () => {
  let db: knex.Knex;
  let mcpServer: ReturnType<typeof createWenerSqlMcpServer>;

  beforeAll(async () => {
    // Create in-memory SQLite database for testing
    db = knex({
      client: 'sqlite3',
      connection: ':memory:',
      useNullAsDefault: true
    });

    // Create test table
    await db.schema.createTable('test_table', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email');
      table.timestamps(true, true);
    });

    // Insert test data
    await db('test_table').insert([
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' }
    ]);

    mcpServer = createWenerSqlMcpServer({
      knex: db,
      readonly: false
    });
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('should list available tools', async () => {
    const result = await mcpServer.listTool({});
    expect(result.tools).toBeDefined();
    expect(result.tools.length).toBeGreaterThan(0);
    
    const toolNames = result.tools.map(t => t.name);
    expect(toolNames).toContain('queryJson');
    expect(toolNames).toContain('queryCsv');
    expect(toolNames).toContain('executeSql');
    expect(toolNames).toContain('listObjects');
    expect(toolNames).toContain('describeObject');
    expect(toolNames).toContain('getVersion');
  });

  it('should execute a simple query', async () => {
    const result = await mcpServer.callTool({
      method: 'queryJson',
      params: {
        query: 'SELECT 1 as test, "hello" as message'
      }
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const data = JSON.parse(result.content[0].text);
    expect(data.rows).toBeDefined();
    expect(data.rows[0].test).toBe(1);
    expect(data.rows[0].message).toBe('hello');
  });

  it('should list database objects', async () => {
    const result = await mcpServer.callTool({
      method: 'listObjects',
      params: {}
    });

    expect(result).toBeDefined();
    expect(result.objects).toBeDefined();
    expect(result.objects.length).toBeGreaterThan(0);
    
    const tableNames = result.objects.map((obj: any) => obj.name);
    expect(tableNames).toContain('test_table');
  });

  it('should describe a database object', async () => {
    const result = await mcpServer.callTool({
      method: 'describeObject',
      params: {
        name: 'test_table'
      }
    });

    expect(result).toBeDefined();
    expect(result.object).toBeDefined();
    expect(result.object.name).toBe('test_table');
    expect(result.object.columns).toBeDefined();
    expect(result.object.columns.length).toBeGreaterThan(0);
    
    const columnNames = result.object.columns.map((col: any) => col.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('email');
  });

  it('should get database version', async () => {
    const result = await mcpServer.callTool({
      method: 'getVersion',
      params: {}
    });

    expect(result).toBeDefined();
    expect(result.version).toBeDefined();
    expect(result.type).toBeDefined();
  });

  it('should execute DML operations', async () => {
    const result = await mcpServer.callTool({
      method: 'executeDml',
      params: {
        query: "INSERT INTO test_table (name, email) VALUES ('Test User', 'test@example.com')"
      }
    });

    expect(result).toBeDefined();
    expect(result.message).toBeDefined();
    expect(result.affectedRows).toBe(1);
  });

  it('should handle read-only mode', async () => {
    const readOnlyServer = createWenerSqlMcpServer({
      knex: db,
      readonly: true
    });

    // Read operations should work
    const readResult = await readOnlyServer.callTool({
      method: 'queryJson',
      params: {
        query: 'SELECT * FROM test_table LIMIT 1'
      }
    });
    expect(readResult).toBeDefined();

    // Write operations should fail
    await expect(readOnlyServer.callTool({
      method: 'executeDml',
      params: {
        query: "INSERT INTO test_table (name) VALUES ('Should Fail')"
      }
    })).rejects.toThrow('DML operations are not allowed in readonly mode');
  });
});