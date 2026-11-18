/*
MySQL / Doris Grammar
=====================

For auditing, parsing and validating SQL. The AST is independent and follows the package's
plain-object/discriminated-node design pattern.

### Rules

- PascalCase for Grammar
- PascalCase for AST `type` discriminants
- snake_case for Tokens
- UPPER_CASE for Keywords

### Options

- dialect: 'mysql' (default) | 'doris' – doris only syntax is gated by `&{ return doris; }`

### Reference

- https://dev.mysql.com/doc/refman/8.4/en/sql-statements.html
- https://dev.mysql.com/doc/refman/8.4/en/operator-precedence.html
- https://doris.apache.org/docs/sql-manual/sql-statements/data-query/SELECT
- https://github.com/taozhi8833998/node-sql-parser/blob/master/pegjs/mysql.pegjs
*/

{{
  /* eslint-disable */
  // ts-nocheck

  // MySQL 8.4 reserved words (information_schema.KEYWORDS WHERE RESERVED = 1). They can not be
  // bare identifiers or aliases, but are allowed right after `.` in a qualified name.
  const MYSQL_RESERVED = new Set([
    "ACCESSIBLE", "ADD", "ALL", "ALTER", "ANALYZE", "AND", "AS", "ASC", "ASENSITIVE", "BEFORE", "BETWEEN", "BIGINT",
    "BINARY", "BLOB", "BOTH", "BY", "CALL", "CASCADE", "CASE", "CHANGE", "CHAR", "CHARACTER", "CHECK", "COLLATE",
    "COLUMN", "CONDITION", "CONSTRAINT", "CONTINUE", "CONVERT", "CREATE", "CROSS", "CUBE", "CUME_DIST",
    "CURRENT_DATE", "CURRENT_TIME", "CURRENT_TIMESTAMP", "CURRENT_USER", "CURSOR", "DATABASE", "DATABASES",
    "DAY_HOUR", "DAY_MICROSECOND", "DAY_MINUTE", "DAY_SECOND", "DEC", "DECIMAL", "DECLARE", "DEFAULT", "DELAYED",
    "DELETE", "DENSE_RANK", "DESC", "DESCRIBE", "DETERMINISTIC", "DISTINCT", "DISTINCTROW", "DIV", "DOUBLE", "DROP",
    "DUAL", "EACH", "ELSE", "ELSEIF", "EMPTY", "ENCLOSED", "ESCAPED", "EXCEPT", "EXISTS", "EXIT", "EXPLAIN",
    "FALSE", "FETCH", "FIRST_VALUE", "FLOAT", "FLOAT4", "FLOAT8", "FOR", "FORCE", "FOREIGN", "FROM", "FULLTEXT",
    "FUNCTION", "GENERATED", "GET", "GRANT", "GROUP", "GROUPING", "GROUPS", "HAVING", "HIGH_PRIORITY",
    "HOUR_MICROSECOND", "HOUR_MINUTE", "HOUR_SECOND", "IF", "IGNORE", "IN", "INDEX", "INFILE", "INNER", "INOUT",
    "INSENSITIVE", "INSERT", "INT", "INT1", "INT2", "INT3", "INT4", "INT8", "INTEGER", "INTERSECT", "INTERVAL",
    "INTO", "IO_AFTER_GTIDS", "IO_BEFORE_GTIDS", "IS", "ITERATE", "JOIN", "JSON_TABLE", "KEY", "KEYS", "KILL",
    "LAG", "LAST_VALUE", "LATERAL", "LEAD", "LEADING", "LEAVE", "LEFT", "LIKE", "LIMIT", "LINEAR", "LINES", "LOAD",
    "LOCALTIME", "LOCALTIMESTAMP", "LOCK", "LONG", "LONGBLOB", "LONGTEXT", "LOOP", "LOW_PRIORITY", "MATCH",
    "MAXVALUE", "MEDIUMBLOB", "MEDIUMINT", "MEDIUMTEXT", "MIDDLEINT", "MINUTE_MICROSECOND", "MINUTE_SECOND", "MOD",
    "MODIFIES", "NATURAL", "NO_WRITE_TO_BINLOG", "NOT", "NTH_VALUE", "NTILE", "NULL", "NUMERIC", "OF", "ON",
    "OPTIMIZE", "OPTIMIZER_COSTS", "OPTION", "OPTIONALLY", "OR", "ORDER", "OUT", "OUTER", "OUTFILE", "OVER",
    "PARTITION", "PERCENT_RANK", "PRECISION", "PRIMARY", "PROCEDURE", "PURGE", "QUALIFY", "RANGE", "RANK", "READ",
    "READ_WRITE", "READS", "REAL", "RECURSIVE", "REFERENCES", "REGEXP", "RELEASE", "RENAME", "REPEAT", "REPLACE",
    "REQUIRE", "RESIGNAL", "RESTRICT", "RETURN", "REVOKE", "RIGHT", "RLIKE", "ROW", "ROW_NUMBER", "ROWS", "SCHEMA",
    "SCHEMAS", "SECOND_MICROSECOND", "SELECT", "SENSITIVE", "SEPARATOR", "SET", "SHOW", "SIGNAL", "SMALLINT",
    "SPATIAL", "SPECIFIC", "SQL", "SQL_BIG_RESULT", "SQL_CALC_FOUND_ROWS", "SQL_SMALL_RESULT", "SQLEXCEPTION",
    "SQLSTATE", "SQLWARNING", "SSL", "STARTING", "STORED", "STRAIGHT_JOIN", "SYSTEM", "TABLE", "TABLESAMPLE",
    "TERMINATED", "THEN", "TINYBLOB", "TINYINT", "TINYTEXT", "TO", "TRAILING", "TRIGGER", "TRUE", "UNDO", "UNION",
    "UNIQUE", "UNLOCK", "UNSIGNED", "UPDATE", "USAGE", "USE", "USING", "UTC_DATE", "UTC_TIME", "UTC_TIMESTAMP",
    "VALUES", "VARBINARY", "VARCHAR", "VARCHARACTER", "VARYING", "VIRTUAL", "WHEN", "WHERE", "WHILE", "WINDOW",
    "WITH", "WRITE", "XOR", "YEAR_MONTH", "ZEROFILL",
  ]);

  // Doris keeps the reserved words this parser used before the MySQL 8.4 list was adopted; the
  // MySQL list has not been verified against Doris.
  const DORIS_RESERVED = new Set([
    "ALL", "AND", "ANTI", "AS", "ASC", "BETWEEN", "BY", "CASE", "CROSS", "DELETE", "DESC", "DISTINCT",
    "DISTINCTROW", "DIV", "ELSE", "END", "EXCEPT", "EXISTS", "FALSE", "FOR", "FORCE", "FROM", "FULL", "GROUP",
    "HAVING", "IGNORE", "IN", "INNER", "INSERT", "INTERSECT", "INTERVAL", "INTO", "IS", "JOIN", "LATERAL",
    "LEFT", "LIKE", "LIMIT", "LOCK", "MINUS", "MOD", "NATURAL", "NOT", "NULL", "OFFSET", "ON", "OR", "ORDER",
    "OUTER", "PARTITION", "QUALIFY", "REGEXP", "REPLACE", "RIGHT", "RLIKE", "SELECT", "SEMI", "SET",
    "STRAIGHT_JOIN", "TABLET", "THEN", "TRUE", "UNION", "UPDATE", "USE", "USING", "VALUES", "WHEN",
    "WHERE", "WINDOW", "WITH", "XOR", "SEPARATOR", "ESCAPE", "OVER", "ROLLUP", "DUPLICATE",
    "ALTER", "CREATE", "LOAD", "RENAME", "COLUMN", "INDEX", "KEY", "JSON_TABLE",
  ]);

  // Reserved words that MySQL also accepts as built-in function names, with their argument count
  // [min, max]. `over` marks window functions, which require an OVER clause; `column` functions take a
  // single column reference; `precision` functions take an optional integer literal.
  const RESERVED_FUNCTIONS = {
    CHAR: [1, Infinity], CHARACTER: [1, Infinity], CURRENT_DATE: [0, 0], CURRENT_TIME: [0, 1, "precision"],
    CURRENT_TIMESTAMP: [0, 1, "precision"], CURRENT_USER: [0, 0], DATABASE: [0, 0], GROUPING: [1, Infinity],
    IF: [3, 3], INSERT: [4, 4], LEFT: [2, 2], LOCALTIME: [0, 1, "precision"], LOCALTIMESTAMP: [0, 1, "precision"],
    MOD: [2, 2], REPEAT: [2, 2], REPLACE: [3, 3], RIGHT: [2, 2], SCHEMA: [0, 0], UTC_DATE: [0, 0],
    UTC_TIME: [0, 1, "precision"], UTC_TIMESTAMP: [0, 1, "precision"],
    VALUES: [1, 1, "column"], DEFAULT: [1, 1, "column"],
    CUME_DIST: [0, 0, "over"], DENSE_RANK: [0, 0, "over"], PERCENT_RANK: [0, 0, "over"], RANK: [0, 0, "over"],
    ROW_NUMBER: [0, 0, "over"], NTILE: [1, 1, "over"], LAG: [1, 3, "over"], LEAD: [1, 3, "over"],
    FIRST_VALUE: [1, 1, "over"], LAST_VALUE: [1, 1, "over"], NTH_VALUE: [2, 2, "over"],
  };

  // Keywords that look like `name(` but are not function calls.
  const NOT_FUNC = new Set([
    "AND", "OR", "XOR", "NOT", "IN", "IS", "LIKE", "REGEXP", "RLIKE", "BETWEEN", "EXISTS", "CASE",
    "INTERVAL", "SELECT", "WITH", "WHEN", "THEN", "ELSE", "END", "ON", "USING", "AS", "FROM", "WHERE",
    "OVER", "DIV", "BINARY", "ESCAPE", "SEPARATOR", "UNION", "EXCEPT", "INTERSECT",
    // special syntax, a plain call such as `CAST(a)` is not valid
    "CAST", "CONVERT", "EXTRACT", "POSITION",
  ]);

  const OPS = { "!=": "!=", "&&": "AND", "||": "OR" };

  function _op(op) {
    let s = Array.isArray(op)
      ? op.flat(Infinity).filter((v) => typeof v === "string" && v.trim()).join(" ")
      : op;
    s = s.toUpperCase();
    return OPS[s] || s;
  }

  function norm(s) {
    return s.replace(/\s+/g, " ").trim().toUpperCase();
  }

  function compact(s) {
    const out = [];
    let pendingSpace = false;
    const push = (value) => {
      if (pendingSpace && out.length) out.push(" ");
      pendingSpace = false;
      out.push(value);
    };
    for (let i = 0; i < s.length;) {
      const c = s[i];
      if (c === "'" || c === '"' || c === "`") {
        const start = i++;
		while (i < s.length) {
			if (s[i] === "\\" && c !== "`") { i += 2; continue; }
			if (c === "`" && s[i] === "`" && s[i + 1] === "`") { i += 2; continue; }
			if (s[i] === c) { i++; if (c === "'" && s[i] === "'") { i++; continue; } break; }
          i++;
        }
        push(s.slice(start, i));
        continue;
      }
      if ((c === "/" && s[i + 1] === "*") || (c === "-" && s[i + 1] === "-" && /[ \t]/.test(s[i + 2] || "")) || c === "#") {
        const start = i;
        if (c === "/") {
          i += 2;
          while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) i++;
          if (i < s.length) i += 2;
        } else {
          while (i < s.length && s[i] !== "\n") i++;
        }
        push(s.slice(start, i));
        continue;
      }
      if (/\s/.test(c)) { pendingSpace = true; i++; continue; }
      push(c);
      i++;
    }
    return out.join("").trim();
  }
}}

{
  const doris = options.dialect === "doris";
  const RESERVED = doris ? DORIS_RESERVED : MYSQL_RESERVED;
  // Literals written as unsigned integer tokens (`2`, not `2.0` or `-2`), for arguments MySQL's grammar
  // restricts to integers.
  const integerTokens = new WeakSet();
  const isIntegerConstant = (a) =>
    integerTokens.has(a) && !a._paren && (typeof a.value === "number" || BigInt(a.value) <= 18446744073709551615n);

  // MySQL aggregate functions: accepted DISTINCT, argument count and whether `*` is allowed.
  const AGGREGATES = {
    COUNT: { distinct: true, min: 1, max: 1, star: true },
    SUM: { distinct: true }, AVG: { distinct: true }, MIN: { distinct: true }, MAX: { distinct: true },
    GROUP_CONCAT: { distinct: true, min: 1, max: Infinity, orderBy: true },
    BIT_AND: {}, BIT_OR: {}, BIT_XOR: {}, STD: {}, STDDEV: {}, STDDEV_POP: {}, STDDEV_SAMP: {},
    VAR_POP: {}, VAR_SAMP: {}, VARIANCE: {}, JSON_ARRAYAGG: {}, JSON_OBJECTAGG: { min: 2, max: 2 },
  };
  // Without IGNORE_SPACE these built-ins only use their special syntax when `(` follows the name directly;
  // `COUNT (a)` is an ordinary call, `COUNT (*)`, `SUM (DISTINCT a)` and `MAX (a) OVER ()` are errors.
  const SPACE_SENSITIVE = new Set([
    "ADDDATE", "BIT_AND", "BIT_OR", "BIT_XOR", "CAST", "COUNT", "CURDATE", "CURTIME", "DATE_ADD", "DATE_SUB",
    "EXTRACT", "GROUP_CONCAT", "MAX", "MID", "MIN", "NOW", "POSITION", "SESSION_USER", "STD", "STDDEV",
    "STDDEV_POP", "STDDEV_SAMP", "SUBDATE", "SUBSTR", "SUBSTRING", "SUM", "SYSDATE", "SYSTEM_USER", "TRIM",
    "VARIANCE", "VAR_POP", "VAR_SAMP",
  ]);
  // Functions that take `INTERVAL expr unit` as their second argument; DATE_ADD / DATE_SUB require it.
  const INTERVAL_FUNCTIONS = { DATE_ADD: true, DATE_SUB: true, ADDDATE: false, SUBDATE: false };

  // Grammar level argument rules of MySQL built-in functions. Stored functions (`db.f`, backticked)
  // and Doris functions are not checked.
  function checkFunction(fn, bare, spaced, all) {
    if (doris) return fn;
    const upper = fn.name.toUpperCase();
    const args = fn.args;
    const builtin = bare && !fn.db;
    // A backticked or qualified name is a stored function. A space-sensitive built-in followed by whitespace
    // is an ordinary call too (kept as `spaced` so formatting does not change the call). Ordinary calls take
    // no DISTINCT / ALL, ORDER BY, SEPARATOR, OVER, `*` or INTERVAL.
    if (!builtin || (spaced && SPACE_SENSITIVE.has(upper))) {
      const special = fn.distinct || all || fn.orderBy || fn.separator || fn.over || args.some((a) => a.type === "Star" || a.type === "Interval");
      if (special) error(builtin ? `No space is allowed between ${upper} and (` : `${fn.name} is not a built-in aggregate or window function`);
      if (builtin) fn.spaced = true;
      return fn;
    }
    {
      const reserved = RESERVED_FUNCTIONS[upper];
      if (RESERVED.has(upper) && !reserved) error(`${upper} is a reserved word`);
      const aggregate = AGGREGATES[upper];
      const rule = reserved || (aggregate && [aggregate.min ?? 1, aggregate.max ?? 1]);
      // COUNT(DISTINCT a, b) counts distinct combinations
      const max = upper === "COUNT" && fn.distinct ? Infinity : rule?.[1];
      if (rule && (args.length < rule[0] || args.length > max)) error(`Wrong number of arguments to ${upper}`);
      if (reserved?.[2] === "column" && args[0].type !== "Column") error(`${upper} requires a column`);
      if (reserved?.[2] === "over" && !fn.over) error(`${upper} requires an OVER clause`);
      // OVER only applies to aggregate and window functions
      if (fn.over && !aggregate && reserved?.[2] !== "over") error(`${upper} is not a window function`);
      // fractional-second precision, NTILE buckets and the LAG / LEAD offset are integer constants
      const constantAt = reserved?.[2] === "precision" || upper === "NTILE" ? 0 : upper === "LAG" || upper === "LEAD" ? 1 : -1;
      const constant = args[constantAt];
      // precision: an integer literal; NTILE / LAG / LEAD also take `?` or a user variable
      const precision = reserved?.[2] === "precision";
      const userVariable = constant?.type === "Var" && constant.scope === "user";
      const placeholder = !constant?._paren && (constant?.type === "Param" || userVariable);
      if (constant && !(isIntegerConstant(constant) || (!precision && placeholder))) {
        error(`${upper} requires an integer constant`);
      }
      if (fn.distinct && !aggregate?.distinct) error(`DISTINCT is not allowed in ${upper}`);
      if (all && !aggregate) error(`ALL is not allowed in ${upper}`);
      if (fn.distinct && upper !== "COUNT" && upper !== "GROUP_CONCAT" && args.length > 1) error(`DISTINCT ${upper} takes one argument`);
      if ((fn.orderBy || fn.separator) && !aggregate?.orderBy) error(`ORDER BY is only allowed in GROUP_CONCAT`);
      // only an unqualified COUNT(*); `COUNT(t.*)` is invalid
      if (args.some((a) => a.type === "Star") && !(upper === "COUNT" && args.length === 1 && !fn.distinct && !args[0].table)) {
        error(`* is not a valid argument of ${upper}`);
      }
      const intervalAt = upper in INTERVAL_FUNCTIONS ? 1 : -1;
      if (args.some((a, i) => a.type === "Interval" && i !== intervalAt)) error(`INTERVAL is not allowed here`);
      if (INTERVAL_FUNCTIONS[upper] && args[1]?.type !== "Interval") error(`${upper} requires an INTERVAL`);
      if (intervalAt === 1 && args.length !== 2) error(`Wrong number of arguments to ${upper}`);
    }
    return fn;
  }
  const locations = options.locations === true;

  // attach source range, keep the inner range when already set (e.g. parenthesized expr)
  function L(node, replace = false) {
    if (locations && node && typeof node === "object" && (replace || !node.loc)) {
      const { start, end } = location();
      node.loc = { start: start.offset, end: end.offset };
    }
    return node;
  }

  // range of a node built from children
  function span(node, a, b) {
    if (locations && a?.loc && b?.loc) node.loc = { start: a.loc.start, end: b.loc.end };
    return node;
  }
  // Failed PEG branches may create parameters. Number only nodes retained in the final AST.
  const paramPositions = new WeakMap();

  function numberParams(ast) {
    // Iterative walk: deep expression chains would overflow the call stack.
    const params = [];
    const stack = [ast];
    while (stack.length) {
      const value = stack.pop();
      if (!value || typeof value !== "object") continue;
      if (paramPositions.has(value)) params.push(value);
      else for (const child of Object.values(value)) if (child && typeof child === "object") stack.push(child);
    }
    params.sort((a, b) => paramPositions.get(a) - paramPositions.get(b));
    params.forEach((param, index) => { param.index = index; });
    return ast;
  }

  function chain(head, tail) {
    return tail.reduce((left, [, op, , right]) => {
      op = _op(op);
      switch (op) {
        case "AND":
        case "OR":
        case "XOR":
          if (left.type === "Logic" && left.op === op && !left._paren) {
            left.exprs.push(right);
            return span(left, left, right);
          }
          return span({ type: "Logic", op, exprs: [left, right] }, left, right);
      }
      return span({ type: "Binary", op, left, right }, left, right);
    }, head);
  }

  // [catalog, db, name] parts → { catalog, db, name }, keys ordered from outer to inner
  function qualify(parts, keys) {
    const o = {};
    const offset = keys.length - parts.length;
    parts.forEach((v, i) => (o[keys[offset + i]] = v));
    return o;
  }

  function qname(node) {
    const { type, loc, ...name } = node;
    return name;
  }

  function referencesFrom(text) {
    const result = [];
    const unquote = (value) => value[0] === "`" ? value.slice(1, -1).replaceAll("``", "`") : value;
    const word = "(`(?:``|[^`])+`|[A-Za-z_$\\u0080-\\uffff][A-Za-z0-9_$\\u0080-\\uffff]*)";
    const masked = maskSql(text);
    const re = new RegExp("\\bREFERENCES\\s+" + word + "(?:\\s*\\.\\s*" + word + "){0,2}", "gi");
    for (const match of masked.matchAll(re)) {
      const parts = match[0].replace(/^REFERENCES\s+/i, "").split(/\s*\.\s*/).map(unquote);
      result.push(qualify(parts, ["catalog", "db", "name"]));
    }
    return result;
  }

  function maskSql(text) {
    const out = text.split("");
    for (let i = 0; i < text.length;) {
      const quote = text[i];
      if (quote === "'" || quote === '"') {
        const start = i++;
        while (i < text.length) {
          if (text[i] === "\\") { out[i++] = " "; if (i < text.length) out[i++] = " "; continue; }
          if (text[i] === quote) { i++; break; }
          out[i++] = " ";
        }
        out[start] = " ";
        continue;
      }
      if ((text[i] === "-" && text[i + 1] === "-" && /[ \t]/.test(text[i + 2] || "")) || text[i] === "#") {
        while (i < text.length && text[i] !== "\n") out[i++] = " ";
        continue;
      }
      if (text[i] === "/" && text[i + 1] === "*") {
        out[i++] = " "; out[i++] = " ";
        while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) out[i++] = " ";
        if (i < text.length) { out[i++] = " "; out[i++] = " "; }
        continue;
      }
      i++;
    }
    return out.join("");
  }

  function alterAction(action) {
    if (!doris && /^(DISTRIBUTED|PROPERTIES)\b/i.test(action)) error("Doris table properties require the doris dialect");
    const references = referencesFrom(action);
    if (/\bREFERENCES\b/i.test(maskSql(action)) && !references.length) error("REFERENCES requires a target table");
    if (!/^(ADD|ALTER|ANALYZE|CHANGE|CHECK|COMMENT|CONVERT|DEFAULT|DISABLE|DISCARD|DISTRIBUTED|DROP|ENABLE|ENGINE|FORCE|IMPORT|MODIFY|OPTIMIZE|ORDER|PROPERTIES|REORGANIZE|REMOVE|SET|TABLESPACE|TRUNCATE|UPGRADE|VALIDATE)\b/i.test(action)) {
      error("Unsupported ALTER TABLE action");
    }
    if (/^(ADD(?:\s+(?:COLUMN|INDEX|KEY|CONSTRAINT))?|DROP(?:\s+(?:COLUMN|INDEX|KEY|CONSTRAINT))?|MODIFY|CHANGE)\s*$/i.test(action)) {
      error("Incomplete ALTER TABLE action");
    }
    return opt({ action, references });
  }

  function withReferences(node) {
    if (node.definition) {
      const references = referencesFrom(node.definition);
      if (/\bREFERENCES\b/i.test(maskSql(node.definition)) && !references.length) error("REFERENCES requires a target table");
      if (references.length) node.references = references;
    }
    return opt(node);
  }

  function list(head, tail) {
    return [head, ...tail.map((v) => v[3])];
  }

  function opt(o) {
    // drop undefined/null/false/[] for compact AST
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (v === undefined || v === null || v === false || (Array.isArray(v) && !v.length && k !== "args")) delete o[k];
    }
    return o;
  }

  function queryInto(q) {
    return q.into || (q.type === "QueryGroup" ? queryInto(q.query) : undefined);
  }

  // MySQL accepts INTO in the last query block of a query expression, even inside parentheses or
  // before the outer ORDER BY / LIMIT, and always applies it to the final result of the whole
  // statement. Collect INTO clauses along that rightmost path.
  function spineIntos(q, out = []) {
    if (q.into) out.push(q);
    if (q.type === "SetOp") spineIntos(q.right, out);
    else if (q.type === "QueryGroup") spineIntos(q.query, out);
    return out;
  }

  function setOperation(left, op, right) {
    if (spineIntos(left).length) error("INTO is only allowed in the last query block of a query expression");
    return span(opt({ type: "SetOp", ...op, left, right }), left, right);
  }

  function attachTail(q, orderBy, limit, before, locking, after) {
    const owners = spineIntos(q);
    if (owners.length + (before ? 1 : 0) + (after ? 1 : 0) > 1) error("A query may have only one INTO clause");
    if (locking.length && q.type !== "Select") error("Locking clauses require a SELECT query block");
    if (locking.length > 1 && locking.some((v) => !v.tables)) error("Multiple locking clauses require distinct OF targets");
    const targets = locking.flatMap((v) => (v.tables || []).map(({ catalog, db, name }) => JSON.stringify([catalog, db, name])));
    if (new Set(targets).size !== targets.length) error("Duplicate locking target");
    // Hoist the destination to the outermost node, where it applies.
    let into = before || after;
    for (const owner of owners) {
      into = owner.into;
      delete owner.into;
    }
    // QueryTerm creates a QueryGroup, so an outer tail never replaces the inner query's tail.
    return opt(Object.assign(q, { orderBy, limit, ...(into ? { into } : {}), ...(locking.length ? { locking } : {}) }));
  }

  function subquery(q) {
    if (queryInto(q)) error("INTO is not allowed in a subquery");
    return q;
  }

  function exportOptions(parts) {
    const result = {};
    for (const part of parts) {
      for (const [key, value] of Object.entries(part)) {
        if (Object.hasOwn(result, key)) error(`Duplicate export option ${key}`);
        result[key] = value;
      }
    }
    return result;
  }

}

Main = statements:Statements { return numberParams(statements); }

// A separate lexical pass shares Comment with whitespace parsing. Collecting here
// avoids side effects and duplicate comments from PEG backtracking.
Comments = items:(c:Comment { return c; } / QuotedToken { return null; } / !("/*" / "'" / "\"" / "`") . { return null; })* EOF {
  return items.filter(Boolean);
}

QuotedToken
  = "'" ("\\" . / "''" / [^'\\])* "'"
  / "\"" ("\\" . / "\"\"" / [^"\\])* "\""
  / "`" ("``" / [^`])* "`"

Statements
  = _ head:Statement? tail:(_ ";" _ @Statement?)* _ EOF {
      return [head, ...tail].filter(Boolean);
    }

Expression = _ e:Expr _ EOF { return numberParams(e); }

Statement = e:Statement0 { return L(e); }

Statement0
  = QueryStatement
  / InsertStatement
  / UpdateStatement
  / DeleteStatement
  / ExplainStatement
  / UseStatement
  / SetStatement
  / DropStatement
  / TruncateStatement
  / CreateStatement
  / AlterTableStatement
  / LoadDataStatement
  / RenameStatement
  / LockTablesStatement
  / UnknownStatement

// =========================================================================
// Query
// =========================================================================

QueryStatement
  = w:WithClause? _ q:QueryExpr {
      if (w) q = { ...q, with: w };
      return L(q, true);
    }

WithClause
  = WITH __ r:(RECURSIVE __)? head:Cte tail:(_ "," _ Cte)* {
      return opt({ recursive: !!r, ctes: list(head, tail) });
    }

Cte
  = name:ident _ cols:IdentParenList? _ AS _ "(" _ q:QueryStatement _ ")" {
      return opt({ name, columns: cols, query: subquery(q) });
    }

QueryExpr
  = q:UnionExpr _ o:OrderByClause? _ l:LimitClause? before:(_ @IntoClause)? locking:(_ @LockClause)* after:(_ @IntoClause)? {
      return attachTail(q, o, l, before, locking, after);
    }

UnionExpr
  = head:IntersectExpr tail:(_ op:(UNION / EXCEPT / &{ return doris; } @MINUS) quantifier:(__ @(ALL / DISTINCT))? _ right:IntersectExpr { return { op, quantifier, right }; })* {
      return tail.reduce((left, { op, quantifier, right }) => setOperation(left, { op, all: quantifier === "ALL", distinct: quantifier === "DISTINCT" }, right), head);
    }

IntersectExpr
  = head:QueryTerm tail:(_ INTERSECT quantifier:(__ @(ALL / DISTINCT))? _ right:QueryTerm { return { quantifier, right }; })* {
      return tail.reduce((left, { quantifier, right }) => setOperation(left, { op: "INTERSECT", all: quantifier === "ALL", distinct: quantifier === "DISTINCT" }, right), head);
    }

QueryTerm
  = q:SelectCore { return L(q); }
  / "(" _ q:QueryStatement _ ")" { return L({ type: "QueryGroup", query: q }); }

SelectCore
  = SELECT
    opts:(__ @SelectOption)*
    _ columns:SelectColumns
    into1:(_ @IntoClause)?
    from:(_ FROM _ @(&{ return !doris; } @DualTable / TableRefs))?
    lv:(_ @LateralView)*
    where:(_ WHERE _ @Expr)?
    group:(_ @GroupByClause)?
    having:(_ HAVING _ @Expr)?
    windows:(_ @WindowClause)?
    qualify:(_ &{ return doris; } "QUALIFY"i !ident_part _ @Expr)? {
      if (opts.filter((v) => ["ALL", "DISTINCT", "DISTINCTROW"].includes(v)).length > 1) error("Conflicting SELECT quantifiers");
      const distinct = opts.some((v) => v === "DISTINCT" || v === "DISTINCTROW");
      const options = opts.filter((v) => v !== "DISTINCT" && v !== "DISTINCTROW" && v !== "ALL");
      return opt({
        type: "Select",
        distinct,
        options,
        columns,
        into: into1,
        from,
        lateralViews: lv,
        where,
        groupBy: group,
        having,
        windows,
        qualify,
      });
    }

SelectOption
  = v:(
      "DISTINCTROW"i / "DISTINCT"i / "ALL"i / "HIGH_PRIORITY"i / "STRAIGHT_JOIN"i / "SQL_SMALL_RESULT"i
      / "SQL_BIG_RESULT"i / "SQL_BUFFER_RESULT"i / "SQL_NO_CACHE"i / "SQL_CACHE"i / "SQL_CALC_FOUND_ROWS"i
    ) !ident_part { return v.toUpperCase(); }

// A bare `*` is only valid as the first select item: `SELECT *, a` but not `SELECT a, *`.
SelectColumns
  = head:(SelectStar / SelectColumn) tail:(_ "," _ !SelectStar @SelectColumn)* { return [head, ...tail]; }

SelectStar
  = "*" { return { expr: L({ type: "Star" }) }; }

SelectColumn
  = expr:Expr alias:(_ @Alias)? { return opt({ expr, alias }); }

Alias
  = AS _ @(ident / string_value)
  / ident
  / string_value

IntoClause
  = INTO __ k:("OUTFILE"i / "DUMPFILE"i) !ident_part _ file:string_value o:(_ @IntoOptions)? {
      if (k.toUpperCase() === "DUMPFILE" && o) error("DUMPFILE does not accept export options");
      return opt({ kind: k.toUpperCase(), file, options: o });
    }
  / INTO _ head:Var tail:(_ "," _ Var)* { return { kind: "VAR", vars: list(head, tail) }; }

// MySQL FIELDS/LINES options, doris FORMAT AS ... PROPERTIES (...)
IntoOptions
  = &{ return doris; } "FORMAT"i __ AS __ format:bare_word properties:(_ @ExportProperties)? {
      return opt({ kind: "doris", format: format.toUpperCase(), properties });
    }
  / &(ExportCharset / ExportFields / ExportLines) charset:ExportCharset? _ fields:ExportFields? _ lines:ExportLines? {
      return opt({ kind: "mysql", charset, fields, lines });
    }

ExportProperties
  = "PROPERTIES"i !ident_part _ "(" _ properties:ExportProperty|1.., _ "," _| _ ")" { return properties; }

ExportProperty = name:string_value _ "=" _ value:string_value { return { name, value }; }

ExportCharset
  = "CHARACTER"i __ SET __ @ident_any

ExportFields
  = ("FIELDS"i / "COLUMNS"i) __ parts:ExportFieldOption|1.., __| { return exportOptions(parts); }

ExportFieldOption
  = "TERMINATED"i __ BY _ value:string_value { return { terminatedBy: value }; }
  / optionally:("OPTIONALLY"i __)? "ENCLOSED"i __ BY _ value:string_value { return opt({ enclosedBy: value, optionally: !!optionally }); }
  / "ESCAPED"i __ BY _ value:string_value { return { escapedBy: value }; }

ExportLines
  = "LINES"i __ parts:ExportLineOption|1.., __| { return exportOptions(parts); }

ExportLineOption
  = "STARTING"i __ BY _ value:string_value { return { startingBy: value }; }
  / "TERMINATED"i __ BY _ value:string_value { return { terminatedBy: value }; }

LateralView
  = &{ return doris; } LATERAL __ VIEW o:(__ OUTER)? __ func:FunctionCall _ alias:ident cols:(_ AS _ @IdentList)? {
      return opt({ outer: !!o, func, alias, columns: cols });
    }

GroupByClause
  = GROUP __ BY _ items:GroupingItems r:(_ WITH __ ROLLUP)? {
      return opt({ items, rollup: !!r });
    }

GroupingItems
  = head:GroupingItem tail:(_ "," _ GroupingItem)* { return list(head, tail); }

GroupingItem
  = &{ return doris; } GROUPING __ SETS _ "(" _ head:GroupingSet tail:(_ "," _ GroupingSet)* _ ")" {
      return { type: "GroupingSets", sets: list(head, tail) };
    }
  / Expr

GroupingSet
  = "(" _ items:Exprs? _ ")" { return items || []; }
  / e:Expr { return [e]; }

WindowClause
  = WINDOW __ head:NamedWindow tail:(_ "," _ NamedWindow)* { return list(head, tail); }

NamedWindow
  = name:ident _ AS _ "(" _ spec:WindowSpec _ ")" { return { name, spec }; }

OrderByClause
  = ORDER __ BY _ @OrderByItems

OrderByItems
  = head:OrderByItem tail:(_ "," _ OrderByItem)* { return list(head, tail); }

OrderByItem
  = expr:Expr order:(_ @(ASC / DESC))? nulls:(_ NULLS __ @(FIRST / LAST))? {
      if (nulls && !doris) error("NULLS FIRST/LAST is not supported by mysql");
      return opt({ expr, order, nulls });
    }

LimitClause
  = LIMIT _ count:LimitValue _ OFFSET _ offset:LimitValue { return { count, offset }; }
  / LIMIT _ a:LimitValue b:(_ "," _ @LimitValue)? {
      return b ? { count: b, offset: a } : { count: a };
    }

// An unsigned integer literal or a placeholder; identifiers are only local variables inside routines.
LimitValue
  = v:$[0-9]+ !(ident_part / ".") {
      if (BigInt(v) > 18446744073709551615n) error("LIMIT value out of range");
      const n = Number(v);
      return Number.isSafeInteger(n) ? { type: "Literal", value: n } : { type: "Literal", value: v, kind: "number" };
    }
  / Param

LockClause
  = FOR __ mode:$(UPDATE / SHARE) tables:(__ OF __ @LockTargets)? wait:(__ @LockWait)? {
      return opt({ mode: mode.toUpperCase(), tables, wait });
    }
  / LOCK __ IN __ SHARE __ MODE { return { mode: "SHARE", legacy: true }; }

LockTargets = LockTarget|1.., _ "," _|

LockTarget
  = table:TableIdent star:(_ "." _ "*")? { return opt({ ...qname(table), star: !!star }); }

LockWait
  = "NOWAIT"i !ident_part { return "NOWAIT"; }
  / "SKIP"i __ "LOCKED"i !ident_part { return "SKIP LOCKED"; }

// =========================================================================
// Table references
// =========================================================================

TableRefs
  = head:TableRef tail:(_ "," _ TableRef)* { return list(head, tail); }

TableRef
  = head:TableFactor tail:(_ JoinPart)* {
      return tail.reduce(
        (left, [, j]) => opt({ type: "Join", join: j.join, natural: j.natural, left, right: j.right, on: j.on, using: j.using, hint: j.hint }),
        head,
      );
    }

JoinPart
  = j:JoinType hint:(_ @JoinHint)? _ right:TableFactor cond:(_ @JoinCondition)? {
      // NATURAL joins derive the condition; outer joins require one
      if (j.natural && cond) error("NATURAL JOIN does not take ON or USING");
      if (!j.natural && /^(LEFT|RIGHT) JOIN$/.test(j.join) && !cond) error(`${j.join} requires ON or USING`);
      return { join: j.join, natural: j.natural, hint, right, ...cond };
    }

JoinCondition
  = ON _ on:Expr { return { on }; }
  / USING _ using:IdentParenList { return { using }; }

JoinType
  = NATURAL __ j:(d:(LEFT / RIGHT) (__ OUTER)? __ JOIN { return `${d} JOIN`; } / INNER __ JOIN { return "JOIN"; } / JOIN { return "JOIN"; }) {
      return { join: j, natural: true };
    }
  / &{ return doris; } d:(LEFT / RIGHT) __ k:(SEMI / ANTI) __ JOIN { return { join: `${d} ${k} JOIN` }; }
  / d:(LEFT / RIGHT) (__ OUTER)? __ JOIN { return { join: `${d} JOIN` }; }
  / &{ return doris; } FULL (__ OUTER)? __ JOIN { return { join: "FULL JOIN" }; }
  / INNER __ JOIN { return { join: "INNER JOIN" }; }
  / CROSS __ JOIN { return { join: "CROSS JOIN" }; }
  / STRAIGHT_JOIN { return { join: "STRAIGHT_JOIN" }; }
  / JOIN { return { join: "JOIN" }; }

JoinHint
  = &{ return doris; } "[" _ v:bare_word _ "]" { return v.toLowerCase(); }

TableFactor = e:TableFactor0 { return L(e); }

TableFactor0
  = l:(LATERAL _)? "(" _ q:QueryStatement _ ")" _ alias:TableAlias? cols:(_ @IdentParenList)? {
      if (!alias && !doris) error("Every derived table must have its own alias");
      return opt({ type: "Derived", query: subquery(q), alias, columns: cols, lateral: !!l });
    }
  / "(" _ refs:TableRefs _ ")" {
      if (refs.length === 1) return refs[0];
      // `(a, b)` → fold as cross join to keep TableExpr shape
      return refs.reduce((left, right) => ({ type: "Join", join: "CROSS JOIN", left, right }));
    }
  / &{ return !doris; } &json_table_keyword @JsonTable
  / &{ return doris; } func:FunctionCall _ alias:TableAlias? { return opt({ type: "TableFunc", func, alias }); }
  / TableNameFactor

JsonTable
  = json_table_keyword _ "(" _ expr:Expr _ "," _ path:string_value _ columns:JsonTableColumns _ ")" _ alias:TableAlias {
      return { type: "JsonTable", expr, path, columns, alias };
    }
  / &json_table_keyword { expected("JSON_TABLE(expr, path COLUMNS(...)) with an alias"); }

JsonTableColumns
  = "COLUMNS"i !ident_part _ "(" _ columns:JsonTableColumn|1.., _ "," _| _ ")" { return columns; }

JsonTableColumn
  = "NESTED"i !ident_part _ (json_table_path _)? path:string_value _ columns:JsonTableColumns {
      return { kind: "nested", path, columns };
    }
  / name:ident __ FOR __ "ORDINALITY"i !ident_part { return { kind: "ordinality", name }; }
  / name:ident __ dataType:json_table_data_type __ exists:(EXISTS __)? json_table_path _ path:string_value responses:(_ @JsonTableResponse)* {
      const column = opt({ kind: "path", name, dataType, path, exists: !!exists });
      for (const { target, response } of responses) {
        if (column[target]) error(`Duplicate JSON_TABLE ${target === "onEmpty" ? "ON EMPTY" : "ON ERROR"}`);
        column[target] = response;
      }
      return column;
    }

JsonTableResponse
  = response:(
      DEFAULT _ value:string_value { return { action: "DEFAULT", value }; }
      / NULL { return { action: "NULL" }; }
      / "ERROR"i !ident_part { return { action: "ERROR" }; }
    ) __ ON __ target:("EMPTY"i !ident_part { return "onEmpty"; } / "ERROR"i !ident_part { return "onError"; }) {
      return { target, response };
    }

json_table_keyword = "JSON_TABLE"i !ident_part
json_table_path = "PATH"i !ident_part

// Dedicated type tokens keep PATH/EXISTS/ON outside the type and preserve literal/name case.
json_table_data_type
  = name:json_table_data_type_name args:(_ @json_table_data_type_args)? modifiers:(__ @json_table_data_type_modifier)* {
      return name + (args || "") + modifiers.map((v) => ` ${v}`).join("");
    }

json_table_data_type_name
  = "NATIONAL"i !ident_part __ second:(@"VARCHAR"i !ident_part / first:$("CHARACTER"i / "CHAR"i) !ident_part varying:(__ "VARYING"i !ident_part)? { return first + (varying ? " VARYING" : ""); }) {
      return `NATIONAL ${second.toUpperCase()}`;
    }
  / "DOUBLE"i !ident_part __ "PRECISION"i !ident_part { return "DOUBLE PRECISION"; }
  / first:("CHARACTER"i / "NCHAR"i / "CHAR"i) !ident_part __ "VARYING"i !ident_part { return `${first.toUpperCase()} VARYING`; }
  / !(json_table_path / EXISTS / ON / FOR) name:bare_word { return name.toUpperCase(); }

json_table_data_type_args
  = "(" _ args:($string_value / $[0-9]+)|1.., _ "," _| _ ")" { return `(${args.join(", ")})`; }

json_table_data_type_modifier
  = modifier:("UNSIGNED"i / "ZEROFILL"i / "BINARY"i / "ASCII"i / "UNICODE"i / "BYTE"i) !ident_part { return modifier.toUpperCase(); }
  / ("CHARACTER"i !ident_part __ "SET"i !ident_part / "CHARSET"i !ident_part) __ name:$(backtick_ident / bare_word) {
      return `CHARACTER SET ${name}`;
    }
  / COLLATE __ name:$(backtick_ident / bare_word) { return `COLLATE ${name}`; }

TableNameFactor
  = bareDual:(&("DUAL"i !ident_part) { return true; })? name:TableIdent
    p:(_ @PartitionClause)?
    t:(_ @TabletClause)?
    alias:(_ @TableAlias)?
    hints:(_ @IndexHint)* {
      const kinds = new Set(hints.map((h) => h.kind));
      if (!doris && kinds.has("USE") && kinds.has("FORCE")) error("USE INDEX and FORCE INDEX can not be combined");
      const { loc, ...table } = name;
      return opt({
        ...table,
        // Doris has no DualTable rule: mark an unquoted, unqualified `dual` like MySQL's keyword
        dual: doris && bareDual && !table.db && !table.catalog,
        alias,
        partition: p?.names,
        temporaryPartition: p?.temporary,
        tablet: t,
        indexHints: hints,
      });
    }

// `FROM DUAL` stands alone: no alias, join or other table.
DualTable
  = name:$("DUAL"i !ident_part) { return [L({ type: "Table", name, dual: true })]; }

TableAlias
  = AS _ @ident
  / ident

PartitionClause
  = PARTITION _ names:IdentParenList { return { names }; }
  / tmp:(TEMPORARY __)? ("PARTITIONS"i / PARTITION) !ident_part _ names:(IdentParenList / n:ident { return [n]; }) &{ return doris; } {
      return { names, temporary: !!tmp };
    }

TabletClause
  = &{ return doris; } TABLET _ "(" _ head:int_value tail:(_ "," _ int_value)* _ ")" { return list(head, tail); }

IndexHint
  = kind:$("USE"i / "IGNORE"i / "FORCE"i) __ ("INDEX"i / "KEY"i) !ident_part scope:(__ FOR __ @IndexHintScope)? _ "(" _ indexes:IndexNameList? _ ")" {
      if (!indexes && kind.toUpperCase() !== "USE") error("Only USE INDEX permits an empty index list");
      return { ...opt({ kind: kind.toUpperCase(), scope }), indexes: indexes || [] };
    }

IndexNameList = head:IndexName tail:(_ "," _ @IndexName)* { return [head, ...tail]; }

IndexName = ident / $("PRIMARY"i !ident_part)

IndexHintScope
  = JOIN { return "JOIN"; }
  / ORDER __ BY { return "ORDER BY"; }
  / GROUP __ BY { return "GROUP BY"; }

// doris allows catalog.db.table
TableIdent
  = head:ident tail:(_ @dot_ident)|0..2| {
      const parts = [head, ...tail];
      if (parts.length > 2 && !doris) error("Catalog qualified table is not supported by mysql");
      return L({ type: "Table", ...qualify(parts, ["catalog", "db", "name"]) });
    }

// =========================================================================
// DML
// =========================================================================

InsertStatement
  = w:WithClause? _
    r:(INSERT / REPLACE)
    pri:(__ @("LOW_PRIORITY"i / "DELAYED"i / "HIGH_PRIORITY"i) !ident_part)?
    ign:(__ IGNORE)?
    ow:(__ "OVERWRITE"i !ident_part &{ return doris; })?
    (__ (INTO / TABLE))?
    _ name:TableIdent
    p:(_ @PartitionClause)?
    label:(_ WITH __ "LABEL"i __ @ident &{ return doris; })?
    cols:(_ @IdentParenList)?
    body:(_ @InsertBody)
    dup:(_ ON __ DUPLICATE __ KEY __ UPDATE _ @Assignments)? {
      return opt({
        type: "Insert",
        with: w,
        replace: r === "REPLACE",
        overwrite: !!ow,
        ignore: !!ign,
        priority: pri?.toUpperCase(),
        table: opt({ ...name, partition: p?.names, temporaryPartition: p?.temporary }),
        label,
        columns: cols,
        ...body,
        onDuplicateUpdate: dup,
      });
    }

InsertBody
  = (VALUES / VALUE) _ head:ValuesRow tail:(_ "," _ ValuesRow)* alias:(_ AS _ @ident)? {
      return opt({ values: list(head, tail), valuesAlias: alias });
    }
  / SET _ set:Assignments { return { set }; }
  / q:QueryStatement { return { query: q }; }

ValuesRow
  = (ROW _)? "(" _ items:ValuesItems? _ ")" { return items || []; }

ValuesItems
  = head:ValuesItem tail:(_ "," _ ValuesItem)* { return list(head, tail); }

ValuesItem
  = DEFAULT !(_ "(") { return { type: "Keyword", value: "DEFAULT" }; }
  / Expr

Assignments
  = head:Assignment tail:(_ "," _ Assignment)* { return list(head, tail); }

Assignment
  = column:Column _ "=" _ value:ValuesItem { return { column, value }; }

UpdateStatement
  = w:WithClause? _ UPDATE
    pri:(__ @"LOW_PRIORITY"i !ident_part)?
    ign:(__ IGNORE)?
    _ tables:TableRefs
    _ SET _ set:Assignments
    from:(_ FROM _ @TableRefs &{ return doris; })?
    where:(_ WHERE _ @Expr)?
    o:(_ @OrderByClause)?
    l:(_ @LimitClause)? {
      return opt({
        type: "Update",
        with: w,
        priority: pri?.toUpperCase(),
        ignore: !!ign,
        tables,
        set,
        from,
        where,
        orderBy: o,
        limit: l,
      });
    }

DeleteStatement
  = w:WithClause? _ DELETE opts:(__ @DeleteOption)* _ body:DeleteBody {
      return opt({ type: "Delete", with: w, options: opts, ...body });
    }

DeleteOption
  = v:("LOW_PRIORITY"i / "QUICK"i / "IGNORE"i) !ident_part { return v.toUpperCase(); }

DeleteBody
  // DELETE FROM t1, t2 USING refs WHERE
  = FROM _ targets:DeleteTargets _ USING _ using:TableRefs where:(_ WHERE _ @Expr)? {
      return opt({ targets, from: using, where });
    }
  // DELETE t1, t2 FROM refs WHERE
  / targets:DeleteTargets _ FROM _ from:TableRefs where:(_ WHERE _ @Expr)? {
      return opt({ targets, from, where });
    }
  // DELETE FROM t [USING refs] WHERE ... ORDER BY ... LIMIT
  / FROM _ t:TableNameFactor using:(_ USING _ @TableRefs &{ return doris; })? where:(_ WHERE _ @Expr)? o:(_ @OrderByClause)? l:(_ @LimitClause)? {
      return opt({ from: [t], using, where, orderBy: o, limit: l });
    }

DeleteTargets
  = head:DeleteTarget tail:(_ "," _ DeleteTarget)* { return list(head, tail); }

DeleteTarget
  = @TableIdent (_ "." _ "*")?

// =========================================================================
// Others
// =========================================================================

ExplainStatement
  = (EXPLAIN / DESCRIBE / DESC) opts:(__ @ExplainOption)* _ s:(QueryStatement / InsertStatement / UpdateStatement / DeleteStatement) {
      return opt({ type: "Explain", options: opts, statement: s });
    }
  / (DESCRIBE / DESC / EXPLAIN) __ table:TableIdent !(_ (ident / "(")) { return { type: "Describe", table }; }

ExplainOption
  = "FORMAT"i _ "=" _ v:("TRADITIONAL"i / "JSON"i / "TREE"i) !ident_part { return `FORMAT=${v.toUpperCase()}`; }
  / v:("ANALYZE"i / "EXTENDED"i / "PARTITIONS"i) !ident_part { return v.toUpperCase(); }
  / &{ return doris; } v:("VERBOSE"i / "GRAPH"i / "PLAN"i / "PARSED"i / "ANALYZED"i / "REWRITTEN"i / "LOGICAL"i / "OPTIMIZED"i / "PHYSICAL"i / "SHAPE"i / "MEMO"i / "DISTRIBUTED"i / "ALL"i) !ident_part {
      return v.toUpperCase();
    }

UseStatement
  = USE __ head:ident tail:(_ "." _ @ident_any)? {
      if (tail && !doris) error("Catalog qualified database is not supported by mysql");
      return { type: "Use", ...qualify(tail ? [head, tail] : [head], ["catalog", "db"]) };
    }

SetStatement
  = SET __ head:SetAssignment tail:(_ "," _ SetAssignment)* { return { type: "Set", assignments: list(head, tail) }; }

SetAssignment
  = target:SetTarget _ (":=" / "=") _ value:SetValue { return { target, value }; }

SetTarget
  = Var
  / s:("GLOBAL"i / "SESSION"i / "LOCAL"i / "PERSIST_ONLY"i / "PERSIST"i) !ident_part __ name:ident_any {
      return { type: "Var", name, scope: s.toLowerCase() === "persist_only" ? "persist" : s.toLowerCase() };
    }
  / name:ident_any { return { type: "Var", name, scope: "session" }; }

SetValue
  = (ON / DEFAULT) !(_ [(.]) { return { type: "Keyword", value: text().toUpperCase() }; }
  / Expr

DropStatement
  = DROP tmp:(__ TEMPORARY)? __ obj:DropObject ie:(__ IF __ EXISTS)? _ head:TableIdent tail:(_ "," _ TableIdent)* f:(__ @("FORCE"i / "RESTRICT"i / "CASCADE"i) !ident_part)? {
      const names = list(head, tail).map(({ type, loc, ...name }) => {
        if (obj !== "DATABASE") return name;
        if (name.catalog) error("Invalid database name");
        // `ctl.db` was parsed as table `db.name`
        return name.db ? { catalog: name.db, name: name.name } : { name: name.name };
      });
      return opt({ type: "Drop", object: obj, temporary: !!tmp, ifExists: !!ie, names, force: f?.toUpperCase() === "FORCE" });
    }

DropObject
  = ("TABLES"i / "TABLE"i) !ident_part { return "TABLE"; }
  / "VIEW"i !ident_part { return "VIEW"; }
  / ("DATABASE"i / "SCHEMA"i) !ident_part { return "DATABASE"; }

TruncateStatement
  = TRUNCATE (__ TABLE)? _ name:TableIdent p:(_ @PartitionClause)? {
      return { type: "Truncate", table: opt({ ...name, partition: p?.names, temporaryPartition: p?.temporary }) };
    }

// -------------------------------------------------------------------------
// Audited DDL and data movement
// -------------------------------------------------------------------------

CreateStatement
  = CreateTableStatement
  / CreateViewStatement
  / CreateDatabaseStatement
  / CreateIndexStatement

CreateTableStatement
  = CREATE tmp:(__ TEMPORARY)? __ TABLE ie:(__ IF __ NOT __ EXISTS __)? _ name:TableIdent body:CreateTableBody {
      return withReferences({ type: "Create", object: "TABLE", name: qname(name), temporary: !!tmp, ifNotExists: !!ie, ...body });
    }

CreateTableBody
  = _ definition:DdlParenthesized options:(__ @CreateOptions)? _ modifier:CreateQueryModifier? as:(AS _)? query:QueryStatement {
      return opt({ definition, options, queryModifier: modifier, query });
    }
  / _ options:CreateOptions modifier:CreateQueryModifier? as:(AS _)? query:QueryStatement {
      return opt({ options, queryModifier: modifier, query });
    }
  / _ modifier:CreateQueryModifier? as:(AS _)? query:QueryStatement {
      return opt({ queryModifier: modifier, query });
    }
  / _ LIKE _ like:TableIdent { return { like: qname(like) }; }
  / _ definition:DdlParenthesized options:(__ @CreateOptions)? { return opt({ definition, options }); }

CreateViewStatement
  = CREATE __ replace:(OR __ REPLACE __)? algorithm:ViewAlgorithm? definer:ViewDefinerPrefix? security:ViewSecurityPrefix? VIEW ie:(__ IF __ NOT __ EXISTS __)? _ name:TableIdent cols:(_ @IdentParenList)? _ AS _ query:QueryStatement check:(_ @ViewCheckOption)? {
      return opt({ type: "Create", object: "VIEW", name: qname(name), replace: !!replace, ifNotExists: !!ie, options: compact([algorithm, definer, security].filter(Boolean).join(" ")) || undefined, query, definition: cols ? `(${cols.join(", ")})` : undefined, withCheckOption: check });
    }

CreateDatabaseStatement
  = CREATE _ obj:(DATABASE / SCHEMA) ie:(__ IF __ NOT __ EXISTS)? _ name:TableIdent tail:(_ @DdlOptions)? {
      const database = qname(name);
      if (!doris && database.db) error("Catalog qualified database is not supported by mysql");
      if (tail && !/^(DEFAULT|CHARACTER|COLLATE|ENCRYPTION)/i.test(tail)) error("Unsupported CREATE DATABASE option");
      return opt({ type: "Create", object: "DATABASE", name: database, ifNotExists: !!ie, options: tail });
    }

CreateIndexStatement
  = CREATE __ unique:("UNIQUE"i __)? kind:("FULLTEXT"i __ "INDEX"i { return "FULLTEXT"; } / "SPATIAL"i __ "INDEX"i { return "SPATIAL"; } / "INDEX"i { return "INDEX"; } / "KEY"i { return "INDEX"; }) __ index:ident prefix:(_ @IndexOptions)? _ ON __ table:TableIdent _ definition:DdlParenthesized options:(_ @IndexTailOptions)? {
      return opt({
        type: "CreateIndex",
        unique: !!unique,
        kind,
        index,
        table: { type: "Table", ...qname(table) },
        definition,
        prefix,
        options,
      });
    }

AlterTableStatement
  = ALTER modifier:(__ m:$("ONLINE"i / "OFFLINE"i / IGNORE) { return m.toUpperCase(); })? __ TABLE _ name:TableIdent _ head:AlterAction tail:(_ "," _ AlterAction)* {
      const actions = [head, ...tail.map((v) => v[3])];
      return opt({ type: "AlterTable", modifier, table: { type: "Table", ...qname(name) }, ...head, action: actions.map((v) => v.action).join(", "), actions });
    }

AlterAction
  = RENAME _ kind:("COLUMN"i / "INDEX"i / "KEY"i) _ old:ident _ (TO / AS)? _ next:ident { return { action: compact(text()) }; }
  / RENAME _ modifier:(TO / AS)? _ target:TableIdent { return { action: compact(text()), renameTo: qname(target) }; }
  / "EXCHANGE"i _ PARTITION _ ident _ WITH _ TABLE _ target:TableIdent validation:(__ "WITHOUT"i __ "VALIDATION"i)? { return { action: compact(text()), exchangeTable: qname(target) }; }
  / !RENAME !"EXCHANGE"i action:AlterOptions { return alterAction(action); }

LoadDataStatement
  = LOAD __ DATA __ priority:(p:$(LOW_PRIORITY / "CONCURRENT"i !ident_part) __ { return p.toUpperCase(); })? local:(LOCAL __)? INFILE _ file:string_value
    mode:(_ m:$(REPLACE / IGNORE) { return m.toUpperCase(); })?
    _ INTO __ TABLE _ name:TableIdent
    partition:(_ PARTITION _ names:IdentParenList { return names; })?
    options:(_ @LoadDataOptions)? set:(_ SET _ @Assignments)? {
      return opt({
        type: "LoadData",
        local: !!local,
        priority,
        file,
        table: { type: "Table", ...qname(name) },
        partition,
        replace: mode === "REPLACE",
        ignore: mode === "IGNORE",
        options,
        set,
      });
    }

RenameStatement
  = RENAME __ TABLE _ head:RenamePair tail:(_ "," _ RenamePair)* {
      return { type: "Rename", renames: list(head, tail) };
    }

RenamePair
  = from:TableIdent _ TO _ to:TableIdent { return { from: qname(from), to: qname(to) }; }

LockTablesStatement
  = LOCK __ (TABLES / TABLE) _ head:LockTable tail:(_ "," _ LockTable)* {
      return { type: "LockTables", locks: list(head, tail) };
    }

LockTable
  = table:TableIdent alias:(__ AS __ @ident / __ a:ident &{ return !["READ", "WRITE", "LOW_PRIORITY"].includes(a.toUpperCase()); } { return a; })? __ mode:LockMode { return { table: opt({ type: "Table", ...qname(table), alias }), mode }; }

LockMode
  = LOW_PRIORITY __ WRITE { return "LOW_PRIORITY WRITE"; }
  / READ (__ LOCAL)? { return text().toUpperCase().replace(/\s+/g, " "); }
  / WRITE { return "WRITE"; }

// DDL options are retained as source text. This keeps table and query dependencies
// structured while preserving comments, identifiers, and string literal values.

CreateOptions
  = &{ return doris; } (!(AS / SELECT / WITH / IGNORE / REPLACE) part:raw_token _)+ { return compact(text()); }
  / MysqlTableOption (_ ","? _ MysqlTableOption)* _ { return compact(text()); }

MysqlTableOption
  = ("ENGINE"i / "SECONDARY_ENGINE"i / "ROW_FORMAT"i / "INSERT_METHOD"i) !ident_part _ "="? _ ident_any
  / (DEFAULT __)? ("CHARACTER"i __ SET / "CHARSET"i / COLLATE) _ "="? _ ident_any
  / ("COMMENT"i / "COMPRESSION"i / "CONNECTION"i / "ENCRYPTION"i / "ENGINE_ATTRIBUTE"i / "SECONDARY_ENGINE_ATTRIBUTE"i) !ident_part _ "="? _ string_value
  / "AUTOEXTEND_SIZE"i !ident_part _ "="? _ [0-9]+ [KMGkmg]? !ident_part
  / ("AUTO_INCREMENT"i / "AVG_ROW_LENGTH"i / "CHECKSUM"i / "DELAY_KEY_WRITE"i / "KEY_BLOCK_SIZE"i / "MAX_ROWS"i / "MIN_ROWS"i / "PACK_KEYS"i / "STATS_AUTO_RECALC"i / "STATS_PERSISTENT"i / "STATS_SAMPLE_PAGES"i) !ident_part _ "="? _ (DEFAULT / int_value)
  / ("DATA"i / "INDEX"i) __ "DIRECTORY"i _ "="? _ string_value
  / "TABLESPACE"i __ ident_any (__ "STORAGE"i __ ("DISK"i / "MEMORY"i))?
  / UNION _ "="? _ "(" _ TableIdent (_ "," _ TableIdent)* _ ")"
  / "START"i __ "TRANSACTION"i !ident_part
  / MysqlPartitionOptions

MysqlPartitionOptions
  = PARTITION __ BY __ MysqlPartitionMethod
    (__ "PARTITIONS"i __ int_value)?
    (__ "SUBPARTITION"i __ BY __ MysqlPartitionMethod (__ "SUBPARTITIONS"i __ int_value)?)?
    (_ DdlParenthesized)?

MysqlPartitionMethod
  = ("LINEAR"i __)? "KEY"i !ident_part (__ "ALGORITHM"i _ "=" _ [12])? _ DdlParenthesized
  / ("LINEAR"i __)? "HASH"i !ident_part _ DdlParenthesized
  / ("RANGE"i / "LIST"i) !ident_part (__ "COLUMNS"i)? _ DdlParenthesized

DdlOptions
  = (!AS part:raw_token _)+ { return compact(text()); }

DdlOptionsAny
  = (part:raw_token _)+ { return compact(text()); }

AlterOptions
  = (!RENAME !"EXCHANGE"i part:alter_raw_token _)+ { return compact(text()); }

LoadDataOptions
  = (!SET part:raw_token _)+ { return compact(text()); }

IndexOptions
  = !ON "USING"i __ ("BTREE"i / "HASH"i) { return compact(text()); }

IndexTailOptions
  = head:IndexTailOption tail:(_ IndexTailOption)* { return compact(text()); }

IndexTailOption
  = "USING"i __ ("BTREE"i / "HASH"i)
  / "COMMENT"i _ string_value
  / "ALGORITHM"i _ "=" _ bare_word
  / "LOCK"i _ "=" _ bare_word
  / "KEY_BLOCK_SIZE"i _ "=" _ int_value
  / "WITH"i __ "PARSER"i _ bare_word
  / "ENGINE_ATTRIBUTE"i _ "=" _ string_value
  / "SECONDARY_ENGINE_ATTRIBUTE"i _ "=" _ string_value
  / "VISIBLE"i
  / "INVISIBLE"i

CreateQueryModifier
  = m:("IGNORE"i / "REPLACE"i) _ { return m.toUpperCase(); }

ViewAlgorithm
  = "ALGORITHM"i _ "=" _ ("UNDEFINED"i / "MERGE"i / "TEMPTABLE"i) _ { return text(); }

ViewDefinerPrefix
  = "DEFINER"i _ "=" _ ViewDefiner _ { return text(); }

ViewSecurityPrefix
  = "SQL"i __ "SECURITY"i __ ("DEFINER"i / "INVOKER"i) _ { return text(); }

ViewDefiner
  = head:("CURRENT_USER"i _ "(" _ ")" / "CURRENT_USER"i / string_value / backtick_ident / bare_word) tail:(_ "@" _ (string_value / backtick_ident / bare_word))?

ViewCheckOption
  = WITH __ ("CASCADED"i / "LOCAL"i)? _ "CHECK"i __ "OPTION"i { return compact(text()); }

DdlParenthesized
  = "(" (DdlParenthesized / string_part / backtick_ident / [^()'"`])* ")" { return text(); }

// Fallback for statements not modeled yet. Query/DML keywords are excluded so real syntax errors surface.
UnknownStatement
  = !(SELECT / WITH / INSERT / REPLACE / UPDATE / DELETE / EXPLAIN / USE / DROP / TRUNCATE / CREATE / ALTER / LOAD / RENAME / LOCK / "(") k:bare_word (_ raw_token)* {
      return { type: "Unknown", keyword: k.toUpperCase(), text: text().trim() };
    }

raw_token
  = string_value
  / backtick_ident
  / "(" (_ raw_token)* _ ")"
  / [^;() \t\r\n'"`]+

alter_raw_token
  = string_value
  / backtick_ident
  / "(" (_ raw_token)* _ ")"
  / [^;(), \t\r\n'"`]+

// =========================================================================
// Expressions – precedence from https://dev.mysql.com/doc/refman/8.4/en/operator-precedence.html
// =========================================================================

Exprs = head:Expr tail:(_ "," _ Expr)* { return list(head, tail); }

Expr
  = left:Var _ ":=" _ right:Expr { return { type: "Binary", op: ":=", left, right }; }
  / OrExpr

OrExpr = head:XorExpr tail:(_ OR _ XorExpr)* { return chain(head, tail); }

XorExpr = head:AndExpr tail:(_ XOR _ AndExpr)* { return chain(head, tail); }

AndExpr = head:NotExpr tail:(_ AND _ NotExpr)* { return chain(head, tail); }

NotExpr = e:NotExpr0 { return L(e); }

NotExpr0
  = NOT _ expr:NotExpr { return { type: "Unary", op: "NOT", expr }; }
  / ComparisonExpr

// MySQL layers: `expr IS [NOT] TRUE|FALSE|UNKNOWN` > bool_pri (`IS [NOT] NULL`, comparisons, a
// left-associative chain) > predicate (one IN / BETWEEN / LIKE / REGEXP / MEMBER OF) > bit_expr.
// So `a = b LIKE c` and `a IS NULL IS NULL` are valid, `a LIKE b LIKE c` and `a IS TRUE IS TRUE` are not.
ComparisonExpr
  = head:BoolPrimary test:(_ @BooleanTest)? {
      return test ? span({ type: "Compare", op: test.op, left: head, right: test.right }, head, test.last) : head;
    }

BooleanTest
  = r:(IS n:(__ NOT)? __ right:BooleanValue { return { op: n ? "IS NOT" : "IS", right }; }) {
      if (locations) r.last = { loc: { start: location().end.offset, end: location().end.offset } };
      return r;
    }

BooleanValue
  = TRUE { return { type: "Literal", value: true }; }
  / FALSE { return { type: "Literal", value: false }; }
  / UNKNOWN { return { type: "Keyword", value: "UNKNOWN" }; }

BoolPrimary
  = head:Predicate tail:(_ @BoolPrimaryRight)* {
      return tail.reduce((left, r) => span(opt({ type: "Compare", op: r.op, left, right: r.right, quantifier: r.quantifier }), left, r.last), head);
    }

BoolPrimaryRight
  = r:BoolPrimaryRight0 { if (locations) r.last = { loc: { start: location().end.offset, end: location().end.offset } }; return r; }

BoolPrimaryRight0
  = IS n:(__ NOT)? __ NULL { return { op: n ? "IS NOT" : "IS", right: { type: "Literal", value: null } }; }
  / op:comparison_operator _ quantifier:(ANY / ALL / SOME) _ "(" _ q:QueryStatement _ ")" {
      return { op, quantifier, right: { type: "Subquery", query: subquery(q) } };
    }
  // ANY / SOME / ALL followed by `(` only take a subquery
  / op:comparison_operator _ !((ANY / ALL / SOME) _ "(") right:Predicate { return { op, right }; }

Predicate
  = head:BitOrExpr r:(_ @PredicateRight)? {
      if (!r) return head;
      let node;
      switch (r.kind) {
        case "in":
          node = opt({ type: "In", not: r.not, expr: head, ...r.right });
          break;
        case "between":
          node = opt({ type: "Between", not: r.not, expr: head, low: r.low, high: r.high });
          break;
        default:
          node = opt({ type: "Compare", op: r.op, left: head, right: r.right, escape: r.escape });
      }
      return span(node, head, r.last);
    }

PredicateRight
  = r:PredicateRight0 { if (locations) r.last = { loc: { start: location().end.offset, end: location().end.offset } }; return r; }

PredicateRight0
  = n:(NOT __)? IN _ right:InRight { return { kind: "in", not: !!n, right }; }
  / n:(NOT __)? BETWEEN _ low:BitOrExpr _ AND _ high:Predicate { return { kind: "between", not: !!n, low, high }; }
  // the pattern and escape are simple expressions: `a LIKE b + 1` needs parentheses
  / n:(NOT __)? LIKE _ right:UnaryExpr escape:(_ ESCAPE _ @UnaryExpr)? {
      return { op: n ? "NOT LIKE" : "LIKE", right, escape };
    }
  / n:(NOT __)? k:(REGEXP / RLIKE) _ right:BitOrExpr { return { op: n ? `NOT ${k}` : k, right }; }
  / MEMBER __ OF _ "(" _ right:Expr _ ")" { return { op: "MEMBER OF", right }; }

InRight
  = "(" _ q:QueryStatement _ ")" { return { query: subquery(q) }; }
  / "(" _ items:Exprs _ ")" { return { list: items }; }
  / &{ return doris; } "[" _ items:Exprs? _ "]" { return { list: items || [] }; }

BitOrExpr = head:BitAndExpr tail:(_ $("|" !"|") _ BitAndExpr)* { return chain(head, tail); }

BitAndExpr = head:ShiftExpr tail:(_ $("&" !"&") _ ShiftExpr)* { return chain(head, tail); }

ShiftExpr = head:AdditiveExpr tail:(_ ("<<" / ">>") _ AdditiveExpr)* { return chain(head, tail); }

// `INTERVAL expr unit` is not a value on its own: it is the right operand of + / -, or the left
// operand of +, e.g. `d + INTERVAL 1 DAY`, `INTERVAL 1 DAY + d`.
AdditiveExpr
  = head:(@IntervalExpr &(_ "+") / MultiplicativeExpr) tail:(_ ("+" / $("-" !">")) _ (IntervalExpr / MultiplicativeExpr))* {
      return chain(head, tail);
    }

MultiplicativeExpr
  = head:BitXorExpr tail:(_ ("*" / "/" / "%" / DIV / MOD) _ BitXorExpr)* { return chain(head, tail); }

BitXorExpr = head:UnaryExpr tail:(_ "^" _ UnaryExpr)* { return chain(head, tail); }

UnaryExpr = e:UnaryExpr0 { return L(e); }

UnaryExpr0
  = op:("-" !">" { return "-"; } / "+" / "~" / "!" !"=" { return "!"; } / BINARY) _ expr:UnaryExpr {
      if ((op === "-" || op === "+") && expr.type === "Literal" && typeof expr.value === "number" && !expr.kind) {
        return { type: "Literal", value: op === "-" ? -expr.value : expr.value };
      }
      return { type: "Unary", op, expr };
    }
  / CollateExpr

CollateExpr = e:CollateExpr0 { return L(e); }

CollateExpr0
  = expr:PostfixExpr c:(_ COLLATE _ @(ident_any / string_value))? {
      return c ? { type: "Collate", expr, collation: c } : expr;
    }

PostfixExpr = e:PostfixExpr0 { return L(e); }

PostfixExpr0
  = head:PrimaryExpr tail:(_ @PostfixOp)* {
      return tail.reduce((expr, p, i) => {
        if (!p.op) return { type: "Subscript", expr, index: p.index };
        // MySQL: `column->path`, not `(expr)->path`, `f()->path` or `col->a->b`
        if (!doris && (i > 0 || expr.type !== "Column" || expr._paren)) error(`${p.op} requires a column reference`);
        return { type: "Binary", op: p.op, left: expr, right: p.right };
      }, head);
    }

PostfixOp
  = op:("->>" / "->") _ right:string { return { op, right }; }
  / &{ return doris; } "[" _ index:Expr _ "]" { return { index }; }

PrimaryExpr = e:PrimaryExpr0 { return L(e); }

PrimaryExpr0
  = "(" _ q:QueryStatement _ ")" { return { type: "Subquery", query: subquery(q) }; }
  / ROW? _ "(" _ head:Expr tail:(_ "," _ Expr)+ _ ")" { return { type: "Row", items: list(head, tail) }; }
  / "(" _ e:Expr _ ")" {
      if (e && typeof e === "object") Object.defineProperty(e, "_paren", { value: true, enumerable: false, configurable: true });
      return e;
    }
  / EXISTS _ "(" _ q:QueryStatement _ ")" { return { type: "Exists", query: subquery(q) }; }
  / &{ return doris; } "[" _ items:Exprs? _ "]" { return { type: "Array", items: items || [] }; }
  / literal
  / Param
  / Var
  / CaseExpr
  / CastExpr
  / SpecialFunction
  / MatchExpr
  / FunctionCall
  / Ref

CaseExpr
  = CASE !(_ WHEN) _ c:Expr cases:CaseWhen+ e:(_ ELSE _ @Expr)? _ END {
      return opt({ type: "Case", condition: c, cases, else: e });
    }
  / CASE cases:CaseWhen+ e:(_ ELSE _ @Expr)? _ END {
      return opt({ type: "Case", cases, else: e });
    }

CaseWhen = _ WHEN _ when:Expr _ THEN _ then:Expr { return { when, then }; }

IntervalExpr
  = INTERVAL _ expr:Expr _ unit:interval_unit { return L({ type: "Interval", expr, unit }); }

CastExpr
  = CAST fn_open _ expr:Expr _ AS _ dataType:cast_type _ ")" { return { type: "Cast", expr, dataType, fn: "CAST" }; }
  / CONVERT _ "(" _ expr:Expr _ "," _ dataType:cast_type _ ")" { return { type: "Cast", expr, dataType, fn: "CONVERT" }; }
  / CONVERT _ "(" _ expr:Expr _ USING _ charset:ident_any _ ")" { return { type: "Cast", expr, charset, fn: "CONVERT" }; }

// MySQL accepts a fixed set of CAST / CONVERT target types (not INT, VARCHAR, TEXT, ...); Doris
// accepts its column data types.
cast_type
  = &{ return doris; } @data_type
  / t:$(mysql_cast_type (__ "ARRAY"i !ident_part)?) {
      return norm(t).replace(/\s*\(\s*/g, "(").replace(/\s*,\s*/g, ",").replace(/\s*\)/g, ")");
    }

mysql_cast_type
  = "BINARY"i !ident_part cast_length?
  / ("CHAR"i / "NCHAR"i / "NATIONAL"i __ "CHAR"i) !ident_part cast_length? (__ cast_charset)?
  / ("SIGNED"i / "UNSIGNED"i) !ident_part (__ ("INTEGER"i / "INT"i) !ident_part)?
  / ("DATETIME"i / "TIME"i) !ident_part cast_length?
  / ("DATE"i / "YEAR"i / "JSON"i / "REAL"i) !ident_part
  / ("DECIMAL"i / "DEC"i) !ident_part (_ "(" _ [0-9]+ (_ "," _ [0-9]+)? _ ")")?
  / "DOUBLE"i !ident_part (__ "PRECISION"i !ident_part)?
  / "FLOAT"i !ident_part cast_length?
  / ("POINT"i / "LINESTRING"i / "POLYGON"i / "MULTIPOINT"i / "MULTILINESTRING"i / "MULTIPOLYGON"i / "GEOMETRYCOLLECTION"i) !ident_part

cast_length = _ "(" _ [0-9]+ _ ")"

// `(` of a space-sensitive built-in: MySQL (without IGNORE_SPACE) requires it right after the name
fn_open
  = &{ return doris; } _ "("
  / "("

cast_charset
  = ("CHARACTER"i __ SET / "CHARSET"i) !ident_part __ (backtick_ident / bare_word)
  / ("ASCII"i / "UNICODE"i / "BYTE"i / "BINARY"i) !ident_part

SpecialFunction
  = name:$"EXTRACT"i fn_open _ unit:interval_unit _ FROM _ e:Expr _ ")" {
      return { type: "Func", name: "EXTRACT", args: [{ type: "Keyword", value: unit }, e] };
    }
  / "TRIM"i fn_open _ mode:(@("BOTH"i / "LEADING"i / "TRAILING"i) !ident_part _)? rem:(@Expr _)? FROM _ s:Expr _ ")" &{ return mode || rem; } {
      return opt({ type: "Func", name: "TRIM", args: rem ? [s, rem] : [s], trim: (mode || "BOTH").toUpperCase() });
    }
  / "POSITION"i fn_open _ a:BitOrExpr _ IN _ b:Expr _ ")" { return { type: "Func", name: "POSITION", args: [a, b] }; }
  / name:("SUBSTRING"i / "SUBSTR"i) fn_open _ s:Expr _ FROM _ a:Expr b:(_ FOR _ @Expr)? _ ")" {
      return { type: "Func", name: name.toUpperCase(), args: b ? [s, a, b] : [s, a] };
    }
  / name:niladic_function !(_ "(") { return { type: "Func", name, args: [] }; }

MatchExpr
  = MATCH _ "(" _ columns:Exprs _ ")" _ AGAINST _ "(" _ against:BitOrExpr mode:(_ @match_mode)? _ ")" {
      return opt({ type: "Match", columns, against, mode });
    }

match_mode
  = (IN __ "NATURAL"i __ "LANGUAGE"i __ MODE (__ WITH __ "QUERY"i __ "EXPANSION"i)?
    / IN __ "BOOLEAN"i __ MODE
    / WITH __ "QUERY"i __ "EXPANSION"i) { return norm(text()); }

FunctionCall
  = name:func_name spaced:$_ "(" _ d:(@(DISTINCT / ALL) __)? args:FuncArgs? o:(_ @OrderByClause)? sep:(_ SEPARATOR _ @Expr)? _ ")" over:(_ @OverClause)? {
      const { bare, ...qualified } = name;
      return checkFunction(opt({ type: "Func", ...qualified, args: args || [], distinct: d === "DISTINCT", orderBy: o, separator: sep, over }), bare, spaced.length > 0, d === "ALL");
    }

FuncArgs = head:FuncArg tail:(_ "," _ FuncArg)* { return list(head, tail); }

FuncArg
  = Lambda
  / "*" { return { type: "Star" }; }
  / @IntervalExpr !(_ ("+" / "-"))
  / Expr

Lambda
  = &{ return doris; } params:(p:ident { return [p]; } / "(" _ @IdentList _ ")") _ "->" !">" !(_ string) _ body:Expr {
      return { type: "Lambda", params, body };
    }

OverClause
  = OVER _ "(" _ spec:WindowSpec _ ")" { return spec; }
  / OVER __ @ident

WindowSpec
  = name:(!(ROWS / RANGE) @ident _)? p:(PARTITION __ BY _ @Exprs _)? o:(@OrderByClause _)? f:WindowFrame? {
      return opt({ name, partitionBy: p, orderBy: o, frame: f });
    }

WindowFrame
  = unit:$(ROWS / RANGE) __ bounds:(BETWEEN __ start:FrameBound __ AND __ end:FrameBound { return { start, end }; } / start:FrameBound { return { start }; }) {
      const { start, end } = bounds;
      if ((start.kind === "unbounded" && start.direction === "FOLLOWING") || (end?.kind === "unbounded" && end.direction === "PRECEDING")) error("Invalid unbounded window frame endpoint");
      if (!end && start.direction === "FOLLOWING") error("A single window frame bound cannot be FOLLOWING");
      if (start.kind === "current" && end?.direction === "PRECEDING") error("Window frame end precedes CURRENT ROW");
      if (start.direction === "FOLLOWING" && (end?.kind === "current" || end?.direction === "PRECEDING")) error("Window frame end precedes its start");
      if (unit.toUpperCase() === "ROWS" && [start, end].some((b) => b?.kind === "offset" && b.value.type === "Interval")) error("INTERVAL frame bounds require RANGE");
      return { unit: unit.toUpperCase(), ...bounds };
    }

FrameBound
  = "UNBOUNDED"i __ direction:frame_direction { return { kind: "unbounded", direction }; }
  / "CURRENT"i __ ROW { return { kind: "current" }; }
  / value:FrameOffset __ direction:frame_direction { return { kind: "offset", value, direction }; }

FrameOffset = value:(IntervalExpr / number_literal / Param) { return L(value); }

frame_direction
  = direction:$("PRECEDING"i / "FOLLOWING"i) !ident_part { return direction.toUpperCase(); }

Param = "?" {
  const param = { type: "Param", index: 0 };
  paramPositions.set(param, location().start.offset);
  return L(param);
}

Var
  = "@@" s:(@("GLOBAL"i / "SESSION"i / "LOCAL"i / "PERSIST_ONLY"i / "PERSIST"i) ".")? name:ident_any {
      const scope = s ? s.toLowerCase().replace("_only", "") : "system";
      return { type: "Var", name, scope };
    }
  / "@" name:(backtick_ident / string_value / $[A-Za-z0-9_$.]+) { return { type: "Var", name, scope: "user" }; }

Ref
  = head:ident tail:(_ @dot_ident)|0..3| star:(_ "." _ "*")? {
      const parts = [head, ...tail];
      if (parts.length > (star ? 2 : 3) && !doris) error("Catalog qualified column is not supported by mysql");
      if (star) {
        if (parts.length > 3) error("Too many qualifiers");
        return { type: "Star", ...qualify(parts, ["catalog", "db", "table"]) };
      }
      return { type: "Column", ...qualify(parts, ["catalog", "db", "table", "name"]) };
    }

Column
  = c:Ref &{ return c.type === "Column"; } { return c; }

// =========================================================================
// Literals
// =========================================================================

literal
  = typed_literal
  / string
  / hex_literal
  / bit_literal
  / number_literal
  / TRUE { return { type: "Literal", value: true }; }
  / FALSE { return { type: "Literal", value: false }; }
  / NULL { return { type: "Literal", value: null }; }

typed_literal
  = k:("DATE"i / "TIMESTAMP"i / "TIME"i) _ v:string_value { return { type: "Literal", value: v, kind: k.toLowerCase() }; }

string
  = charset:charset_prefix v:string_value { return { type: "Literal", value: v, charset }; }
  / v:string_value { return { type: "Literal", value: v }; }

charset_prefix
  = [nN] &"'" { return "utf8"; }
  / "_" n:$[A-Za-z0-9]+ &['"] { return n.toLowerCase(); }

// adjacent strings are concatenated: 'a' 'b' → 'ab'
string_value
  = head:string_part tail:(_ @string_part)* { return head + tail.join(""); }

string_part
  = "'" v:single_char* "'" { return v.join(""); }
  / "\"" v:double_char* "\"" { return v.join(""); }

single_char = "''" { return "'"; } / escape_char / [^'\\]

double_char = "\"\"" { return "\""; } / escape_char / [^"\\]

escape_char
  = "\\" c:. {
      switch (c) {
        case "0": return "\0";
        case "b": return "\b";
        case "n": return "\n";
        case "r": return "\r";
        case "t": return "\t";
        case "Z": return "\x1a";
        // `\%` and `\_` keep the backslash for LIKE patterns
        case "%": return "\\%";
        case "_": return "\\_";
      }
      return c;
    }

hex_literal
  = [xX] "'" v:$[^']* "'" {
      if (!/^([0-9a-fA-F]{2})*$/.test(v)) error("Invalid hexadecimal literal");
      return { type: "Literal", value: v.toLowerCase(), kind: "hex" };
    }
  / "0x" v:$[0-9a-fA-F]+ !ident_part { return { type: "Literal", value: v.toLowerCase(), kind: "hex" }; }

bit_literal
  = [bB] "'" v:$[^']* "'" {
      if (!/^[01]*$/.test(v)) error("Invalid bit literal");
      return { type: "Literal", value: v, kind: "bit" };
    }
  / "0b" v:$[01]+ !ident_part { return { type: "Literal", value: v, kind: "bit" }; }

number_literal
  = ([0-9]+ ("." [0-9]*)? / "." [0-9]+) ([eE] [+-]? [0-9]+)? !ident_start {
      const s = text();
      const v = Number(s);
      const integer = /^[0-9]+$/.test(s);
      const node = integer && !Number.isSafeInteger(v) ? { type: "Literal", value: s, kind: "number" } : { type: "Literal", value: v };
      if (integer) integerTokens.add(node);
      return node;
    }

int_value = [0-9]+ { return Number(text()); }

// =========================================================================
// Identifiers
// =========================================================================

IdentList = head:ident tail:(_ "," _ ident)* { return list(head, tail); }

IdentParenList = "(" _ @IdentList _ ")"

ident "identifier"
  = backtick_ident
  / n:bare_word !{ return RESERVED.has(n.toUpperCase()); } { return n; }

// after `.` reserved words are allowed
ident_any = backtick_ident / bare_word

// `t.select` is valid, `t. select` is not: MySQL only reads a reserved word as an identifier
// directly after the dot.
dot_ident
  = "." @ident_any
  / "." __ @ident

func_name "function name"
  = head:backtick_ident tail:("." @ident_any)? { return tail ? { name: tail, db: head } : { name: head, quoted: true }; }
  / head:bare_word !{ return NOT_FUNC.has(head.toUpperCase()); } tail:("." @ident_any)? {
      return tail ? { name: tail, db: head } : { name: head, bare: true };
    }

backtick_ident = "`" v:("``" { return "`"; } / [^`])+ "`" { return v.join(""); }

bare_word = $(ident_start ident_part*)

ident_start = [A-Za-z_$\u0080-\uffff]

ident_part = [A-Za-z0-9_$\u0080-\uffff]

data_type
  = data_type_word (_ data_type_word)* { return norm(text()).replace(/\s*([(),<>:])\s*/g, "$1"); }

data_type_word
  = !AS bare_word (_ "(" _ [^)]* _ ")")? (_ data_type_generic)?

data_type_generic = "<" ([^<>] / data_type_generic)* ">"

interval_unit
  = u:(
      "SECOND_MICROSECOND"i / "MINUTE_MICROSECOND"i / "MINUTE_SECOND"i / "HOUR_MICROSECOND"i / "HOUR_SECOND"i
      / "HOUR_MINUTE"i / "DAY_MICROSECOND"i / "DAY_SECOND"i / "DAY_MINUTE"i / "DAY_HOUR"i / "YEAR_MONTH"i
      / "MICROSECOND"i / "SECOND"i / "MINUTE"i / "HOUR"i / "DAY"i / "WEEK"i / "MONTH"i / "QUARTER"i / "YEAR"i
    ) !ident_part { return u.toUpperCase(); }

niladic_function
  = n:(
      "CURRENT_TIMESTAMP"i / "CURRENT_DATE"i / "CURRENT_TIME"i / "CURRENT_USER"i / "LOCALTIMESTAMP"i / "LOCALTIME"i
      / "UTC_TIMESTAMP"i / "UTC_DATE"i / "UTC_TIME"i
    ) !ident_part { return n.toUpperCase(); }

comparison_operator
  = "<=>"
  / ">="
  / "<="
  / "<>"
  / "!="
  / ">"
  / "<"
  / "="

// =========================================================================
// Keywords
// =========================================================================

AGAINST = "AGAINST"i !ident_part
ALTER = "ALTER"i !ident_part
ALL = "ALL"i !ident_part { return "ALL"; }
AND = ("AND"i !ident_part / "&&") { return "AND"; }
ANTI = "ANTI"i !ident_part { return "ANTI"; }
ANY = "ANY"i !ident_part { return "ANY"; }
AS = "AS"i !ident_part
ASC = "ASC"i !ident_part { return "ASC"; }
BETWEEN = "BETWEEN"i !ident_part
BINARY = "BINARY"i !ident_part { return "BINARY"; }
BY = "BY"i !ident_part
CASE = "CASE"i !ident_part
CREATE = "CREATE"i !ident_part
CAST = "CAST"i !ident_part
COLLATE = "COLLATE"i !ident_part
CONVERT = "CONVERT"i !ident_part
CROSS = "CROSS"i !ident_part
DATABASE = "DATABASE"i !ident_part
DATA = "DATA"i !ident_part
DEFAULT = "DEFAULT"i !ident_part
DELETE = "DELETE"i !ident_part
DESC = "DESC"i !ident_part { return "DESC"; }
DESCRIBE = "DESCRIBE"i !ident_part
DISTINCT = "DISTINCT"i !ident_part { return "DISTINCT"; }
DIV = "DIV"i !ident_part { return "DIV"; }
DROP = "DROP"i !ident_part
DUPLICATE = "DUPLICATE"i !ident_part
ELSE = "ELSE"i !ident_part
END = "END"i !ident_part
ESCAPE = "ESCAPE"i !ident_part
EXCEPT = "EXCEPT"i !ident_part { return "EXCEPT"; }
EXISTS = "EXISTS"i !ident_part
EXPLAIN = "EXPLAIN"i !ident_part
FALSE = "FALSE"i !ident_part
FIRST = "FIRST"i !ident_part { return "FIRST"; }
FOR = "FOR"i !ident_part
FROM = "FROM"i !ident_part
FULL = "FULL"i !ident_part
GROUP = "GROUP"i !ident_part
GROUPING = "GROUPING"i !ident_part
HAVING = "HAVING"i !ident_part
IF = "IF"i !ident_part
INFILE = "INFILE"i !ident_part
IGNORE = "IGNORE"i !ident_part
IN = "IN"i !ident_part
INNER = "INNER"i !ident_part
INSERT = "INSERT"i !ident_part { return "INSERT"; }
INTERSECT = "INTERSECT"i !ident_part { return "INTERSECT"; }
INTERVAL = "INTERVAL"i !ident_part
INTO = "INTO"i !ident_part
IS = "IS"i !ident_part
JOIN = "JOIN"i !ident_part
KEY = "KEY"i !ident_part
LAST = "LAST"i !ident_part { return "LAST"; }
LATERAL = "LATERAL"i !ident_part
LEFT = "LEFT"i !ident_part { return "LEFT"; }
LOAD = "LOAD"i !ident_part
LIKE = "LIKE"i !ident_part
LIMIT = "LIMIT"i !ident_part
LOCAL = "LOCAL"i !ident_part
LOCK = "LOCK"i !ident_part
LOW_PRIORITY = "LOW_PRIORITY"i !ident_part
MATCH = "MATCH"i !ident_part
MEMBER = "MEMBER"i !ident_part
MINUS = "MINUS"i !ident_part { return "MINUS"; }
MOD = "MOD"i !ident_part { return "MOD"; }
MODE = "MODE"i !ident_part
NATURAL = "NATURAL"i !ident_part
NOT = "NOT"i !ident_part
NULL = "NULL"i !ident_part
NULLS = "NULLS"i !ident_part
OF = "OF"i !ident_part
OFFSET = "OFFSET"i !ident_part
ON = "ON"i !ident_part
OR = ("OR"i !ident_part / "||") { return "OR"; }
ORDER = "ORDER"i !ident_part
OUTER = "OUTER"i !ident_part
OVER = "OVER"i !ident_part
PARTITION = "PARTITION"i !ident_part
RANGE = "RANGE"i !ident_part
READ = "READ"i !ident_part
RECURSIVE = "RECURSIVE"i !ident_part
REGEXP = "REGEXP"i !ident_part { return "REGEXP"; }
REPLACE = "REPLACE"i !ident_part { return "REPLACE"; }
RENAME = "RENAME"i !ident_part
RIGHT = "RIGHT"i !ident_part { return "RIGHT"; }
RLIKE = "RLIKE"i !ident_part { return "RLIKE"; }
SCHEMA = "SCHEMA"i !ident_part
ROLLUP = "ROLLUP"i !ident_part
ROW = "ROW"i !ident_part
ROWS = "ROWS"i !ident_part
SELECT = "SELECT"i !ident_part
SEMI = "SEMI"i !ident_part { return "SEMI"; }
SEPARATOR = "SEPARATOR"i !ident_part
SET = "SET"i !ident_part
SETS = "SETS"i !ident_part
SHARE = "SHARE"i !ident_part
SOME = "SOME"i !ident_part { return "SOME"; }
STRAIGHT_JOIN = "STRAIGHT_JOIN"i !ident_part
TABLE = "TABLE"i !ident_part
TABLET = "TABLET"i !ident_part
TABLES = "TABLES"i !ident_part
TEMPORARY = "TEMPORARY"i !ident_part
THEN = "THEN"i !ident_part
TO = "TO"i !ident_part
TRUE = "TRUE"i !ident_part
TRUNCATE = "TRUNCATE"i !ident_part
UNION = "UNION"i !ident_part { return "UNION"; }
UNKNOWN = "UNKNOWN"i !ident_part
UPDATE = "UPDATE"i !ident_part
USE = "USE"i !ident_part
USING = "USING"i !ident_part
VALUE = "VALUE"i !ident_part
VALUES = "VALUES"i !ident_part
VIEW = "VIEW"i !ident_part
WHEN = "WHEN"i !ident_part
WHERE = "WHERE"i !ident_part
WINDOW = "WINDOW"i !ident_part
WITH = "WITH"i !ident_part
WRITE = "WRITE"i !ident_part
XOR = "XOR"i !ident_part { return "XOR"; }

// =========================================================================
// Whitespace & comments
// =========================================================================

_ "whitespace" = white* { return ""; }

__ "whitespace" = white+ { return " "; }

white
  = [ \t\n\r]
  / Comment

Comment
  = "/*" marker:[+!]? content:$(!"*/" .)* "*/" {
      const { start, end } = location();
      const node = {
        type: "Comment",
        kind: marker === "+" ? "hint" : marker === "!" ? "executable" : "block",
        raw: text(),
        value: content,
        loc: { start: start.offset, end: end.offset },
      };
      if (marker === "!") {
        // Nested executable-comment lexing depends on MySQL's version-specific
        // lexer. Do not flatten a truncated wrapper and hide its remaining SQL.
        if (content.includes("/*")) error("Nested comments inside executable comments are not supported");
        // MySQL 8.4 recognizes six digits followed by whitespace/end, otherwise
        // five digits. A shorter numeric prefix is an ordinary comment.
        const version = /^(\d{6})(?=\s|$)/.exec(content) || /^(\d{5})/.exec(content);
        if (version) {
          node.version = Number(version[1]);
          node.value = content.slice(version[1].length);
        }
        if (version || !/^\d/.test(content)) {
          node.body = { start: start.offset + 3 + (version?.[1].length || 0), end: end.offset - 2 };
        }
      }
      return node;
    }
  / marker:("--" (&[\x00-\x20] / EOF) / "#") content:$[^\r\n]* {
      const { start, end } = location();
      return { type: "Comment", kind: "line", raw: text(), value: content, loc: { start: start.offset, end: end.offset } };
    }

EOF = !.
