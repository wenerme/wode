/** 内联进程脚本保持 CLI 单文件；OS 进程终止可打断同步 SQLite 原生调用。 */
export const SQLITE_PROCESS_SOURCE = String.raw`
const { DatabaseSync } = require('node:sqlite');
let db;
let workerData;
const value = (v) => typeof v === 'bigint' ? (v <= BigInt(Number.MAX_SAFE_INTEGER) && v >= BigInt(Number.MIN_SAFE_INTEGER) ? Number(v) : String(v)) : v instanceof Uint8Array ? Array.from(v) : v;
const row = (v) => Object.fromEntries(Object.entries(v).map(([k, v]) => [k, value(v)]));
function statement(input, write) {
  db.exec('PRAGMA query_only = ' + (write && !workerData.readOnly ? 'OFF' : 'ON'));
  const query = db.prepare(input.statement);
  query.setReadBigInts(true);
  const params = (input.params || []).map((v) => typeof v === 'boolean' ? Number(v) : v);
  const columns = query.columns().map((c) => c.name);
  if (!columns.length) {
    const result = query.run(...params);
    return { columns, rows: [], affectedRows: value(result.changes), lastInsertId: String(result.lastInsertRowid) };
  }
  const rows = [];
  const offset = input.offset || 0;
  const limit = input.limit === undefined ? 100 : input.limit;
  let index = 0;
  for (const item of query.iterate(...params)) {
    if (index++ < offset) continue;
    rows.push(row(item));
    if (rows.length >= limit) break;
  }
  return { columns, rows };
}
process.on('message', ({ id, method, input }) => {
  if (method === 'initialize') {
    try {
      workerData = input;
      db = new DatabaseSync(input.filename, { readOnly: input.readOnly, timeout: input.busyTimeoutMs });
    } catch { process.exit(1); }
    return;
  }
  const start = performance.now();
  try {
    let result;
    if (method === 'ping') {
      result = { ok: true, version: db.prepare('SELECT sqlite_version() AS version').get().version };
    } else if (method === 'query' || method === 'exec') {
      result = statement(input, method === 'exec');
    } else if (method === 'listObject') {
      const schema = input.parent && input.parent.schema || 'main';
      if (!['main', 'temp'].includes(schema)) throw new Error('Invalid SQL schema');
      const rows = db.prepare('SELECT name, type FROM ' + schema + '.sqlite_schema WHERE type IN (\'table\', \'view\') AND name NOT LIKE \'sqlite_%\' AND (? IS NULL OR instr(lower(name), lower(?)) > 0) ORDER BY name LIMIT ? OFFSET ?')
        .all(input.search || null, input.search || null, input.limit || 100, input.offset || 0);
      result = rows.map((v) => ({ name: v.name, type: v.type, schema }));
    } else if (method === 'describeObject') {
      const schema = input.object.schema || 'main';
      if (!['main', 'temp'].includes(schema)) throw new Error('Invalid SQL schema');
      const object = db.prepare('SELECT name, type FROM ' + schema + '.sqlite_schema WHERE name = ? AND type IN (\'table\', \'view\')').get(input.object.name);
      if (!object) throw new Error('SQL object not found');
      const columns = db.prepare('SELECT * FROM pragma_table_info(?, ?)').all(input.object.name, schema);
      result = {
        object: { name: object.name, type: object.type, schema },
        children: columns.map((c) => ({ name: c.name, type: 'column', attributes: {
          dataType: c.type, nullable: !c.notnull, defaultValue: c.dflt_value, ordinal: c.cid + 1, primaryKey: !!c.pk,
        } })),
      };
    } else {
      throw new Error('Unknown SQL operation');
    }
    if (!Array.isArray(result)) result.durationMs = performance.now() - start;
    process.send({ id, result });
  } catch {
    process.send({ id, error: 'SQL request failed' });
  }
});
`;
