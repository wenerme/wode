import { defineServiceCliBinding, type ServiceCliBinding } from '@wener/common/service/cli';
import { TencentClsServiceProvider } from '@wener/common/service/cls';
import { TencentClsCliDefinition } from '@wener/common/service/cls/cli';
import { createTencentClsServiceToolClient } from '@wener/common/service/cls/client';
import { GrafanaServiceProvider } from '@wener/common/service/grafana';
import { GrafanaCliDefinition } from '@wener/common/service/grafana/cli';
import { createGrafanaServiceToolClient } from '@wener/common/service/grafana/client';
import { PrometheusServiceProvider } from '@wener/common/service/prometheus';
import { PrometheusCliDefinition } from '@wener/common/service/prometheus/cli';
import { createPrometheusServiceToolClient } from '@wener/common/service/prometheus/client';
import { RedisServiceProvider } from '@wener/common/service/redis';
import { SqlServiceProvider } from '@wener/common/service/sql';
import { RedisCliDefinition } from '@wener/common/service/redis/cli';
import { createRedisServiceToolClient } from '@wener/common/service/redis/client';
import { S3ServiceProvider } from '@wener/common/service/s3';
import { S3CliDefinition } from '@wener/common/service/s3/cli';
import { createS3ServiceToolClient } from '@wener/common/service/s3/client';
import { SQLCliDefinition } from '@wener/common/service/sql/cli';
import { createSqlServiceToolClient } from '@wener/common/service/sql/client';
import { LinearServiceCliBinding } from '@wener/common/service/linear/cli';
import { LarkServiceCliBinding } from '@wener/common/service/lark/cli';
import { TelegramServiceProvider } from '@wener/common/service/telegram';
import { TelegramCliDefinition } from '@wener/common/service/telegram/cli';
import { createTelegramServiceToolClient } from '@wener/common/service/telegram/client';

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
	defineServiceCliBinding({
		provider: S3ServiceProvider,
		definition: {
			...S3CliDefinition,
			examples: [
				{ command: 'woctl s3 list --prefix uploads/', description: 'List objects under a prefix' },
				{ command: 'woctl s3 get path/to/object.txt', description: 'Read an object as text' },
			],
			commands: S3CliDefinition.commands.map((operation) =>
				operation.name === 'list'
					? { ...operation, examples: [{ command: 'woctl s3 list --prefix uploads/' }] }
					: operation,
			),
		},
		createClient: (runtime, service, { signal, readOnly }) => createS3ServiceToolClient(runtime, service, { signal, readOnly }),
	}),
	LinearServiceCliBinding,
	LarkServiceCliBinding,
	defineServiceCliBinding({
		provider: TencentClsServiceProvider,
		definition: {
			...TencentClsCliDefinition,
			examples: [
				{ command: 'woctl cls query --topic my-topic "*"', description: 'Search a log topic' },
				{ command: 'woctl cls topics', description: 'List log topics' },
			],
			commands: TencentClsCliDefinition.commands.map((operation) =>
				operation.name === 'query'
					? {
							...operation,
							examples: [{ command: 'woctl cls query --topic my-topic "*"' }],
						}
					: operation,
			),
		},
		createClient: (runtime, service, { signal }) => createTencentClsServiceToolClient(runtime, service, { signal }),
	}),
	defineServiceCliBinding({
		provider: TelegramServiceProvider,
		definition: {
			...TelegramCliDefinition,
			examples: [
				{ command: 'woctl telegram status', description: 'Check the configured bot identity' },
				{ command: 'woctl telegram send --chat 123456789 --text "hello" --yes', description: 'Send a message' },
			],
			commands: TelegramCliDefinition.commands.map((operation) =>
				operation.name === 'send'
					? {
							...operation,
							examples: [{ command: 'woctl telegram send --chat 123456789 --text "hello" --yes' }],
						}
					: operation,
			),
		},
		createClient: (runtime, service, { signal, readOnly }) => createTelegramServiceToolClient(runtime, service, { signal, readOnly }),
	}),
]);