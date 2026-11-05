import { defineServiceCliBinding, type ServiceCliBinding } from '../cli';
import { GrafanaServiceProvider } from '../grafana';
import { GrafanaCliDefinition } from '../grafana/cli';
import { createGrafanaServiceToolClient } from '../grafana/client';
import { PrometheusServiceProvider } from '../prometheus';
import { PrometheusCliDefinition } from '../prometheus/cli';
import { createPrometheusServiceToolClient } from '../prometheus/client';
import { RedisServiceProvider } from '../providers/redis';
import { SqlServiceProvider } from '../providers/sql';
import { RedisCliDefinition } from '../redis/cli';
import { createRedisServiceToolClient } from '../redis/client';
import { SQLCliDefinition } from '../sql/cli';
import { createSqlServiceToolClient } from '../sql/client';
import { LinearServiceCliBinding } from '../linear/cli';

/** Explicit CLI entry point; provider registration does not depend on command definitions. */
export const BuiltinServiceCliBindings: readonly ServiceCliBinding[] = Object.freeze([
	defineServiceCliBinding({
		provider: SqlServiceProvider,
		definition: {
			...SQLCliDefinition,
			examples: [
				{ command: 'woctl sql query "SELECT 1 AS value"', description: 'Run a read-only query' },
				{
					command: 'woctl sql query "SELECT * FROM users WHERE id = ?" --params \'[1]\'',
					description: 'Bind a query parameter',
				},
			],
			commands: SQLCliDefinition.commands.map((operation) =>
				operation.name === 'query'
					? {
							...operation,
							examples: [{ command: 'woctl sql query "SELECT * FROM users WHERE id = ?" --params \'[1]\'' }],
						}
					: operation,
			),
		},
		createClient: createSqlServiceToolClient,
	}),
	defineServiceCliBinding({
		provider: RedisServiceProvider,
		definition: {
			...RedisCliDefinition,
			examples: [
				{ command: 'woctl redis ping', description: 'Check Redis connectivity' },
				{ command: "woctl redis scan --match 'user:*' --count 100", description: 'Scan matching keys' },
			],
			commands: RedisCliDefinition.commands.map((operation) =>
				operation.name === 'scan'
					? {
							...operation,
							examples: [{ command: "woctl redis scan --match 'user:*' --count 100" }],
						}
					: operation,
			),
		},
		createClient: (runtime, service, { signal }) => createRedisServiceToolClient(runtime, service, { signal }),
	}),
	defineServiceCliBinding({
		provider: PrometheusServiceProvider,
		definition: {
			...PrometheusCliDefinition,
			examples: [
				{ command: 'woctl prometheus query up', description: 'Query current target health' },
				{
					command: 'woctl prometheus query-range up --start now-1h --end now --step 60',
					description: 'Query target health over the last hour',
				},
			],
			commands: PrometheusCliDefinition.commands.map((operation) =>
				operation.name === 'query-range'
					? {
							...operation,
							examples: [{ command: 'woctl prometheus query-range up --start now-1h --end now --step 60' }],
						}
					: operation,
			),
		},
		createClient: (runtime, service, { signal }) => createPrometheusServiceToolClient(runtime, service, { signal }),
	}),
	defineServiceCliBinding({
		provider: GrafanaServiceProvider,
		definition: {
			...GrafanaCliDefinition,
			examples: [
				{ command: 'woctl grafana status', description: 'Check Grafana health' },
				{ command: 'woctl grafana api /api/search --query type=dash-db', description: 'List dashboards' },
			],
			commands: GrafanaCliDefinition.commands.map((operation) =>
				operation.name === 'api'
					? {
							...operation,
							examples: [{ command: 'woctl grafana api /api/search --query type=dash-db' }],
						}
					: operation,
			),
		},
		createClient: (runtime, service, { signal, readOnly }) => createGrafanaServiceToolClient(runtime, service, { signal, readOnly }),
	}),
	LinearServiceCliBinding,
]);
