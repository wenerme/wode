import { afterAll, describe, expect, it } from 'vitest';
import { createGrafanaMcpServer } from './server';

const ExpectedToolNames = [
	'health',
	'search_dashboards',
	'search_folders',
	'list_datasources',
	'get_datasource',
	'get_dashboard_by_uid',
	'update_dashboard',
	'get_dashboard_panel_queries',
	'get_dashboard_property',
	'get_dashboard_summary',
	'create_folder',
	'generate_deeplink',
	'get_annotations',
	'create_annotation',
	'update_annotation',
	'get_annotation_tags',
	'get_panel_image',
	'get_query_examples',
	'list_prometheus_metric_metadata',
	'query_prometheus',
	'list_prometheus_metric_names',
	'list_prometheus_label_names',
	'list_prometheus_label_values',
	'query_prometheus_histogram',
	'list_loki_label_names',
	'list_loki_label_values',
	'query_loki_logs',
	'query_loki_stats',
	'query_loki_patterns',
	'query_elasticsearch',
	'query_cloudwatch',
	'list_cloudwatch_namespaces',
	'list_cloudwatch_metrics',
	'list_cloudwatch_dimensions',
	'query_clickhouse',
	'list_clickhouse_tables',
	'describe_clickhouse_table',
	'run_panel_query',
	'search_logs',
	'alerting_manage_rules',
	'alerting_manage_routing',
	'list_incidents',
	'create_incident',
	'add_activity_to_incident',
	'get_incident',
	'list_oncall_schedules',
	'get_oncall_shift',
	'get_current_oncall_users',
	'list_oncall_teams',
	'list_oncall_users',
	'list_alert_groups',
	'get_alert_group',
	'get_sift_investigation',
	'get_sift_analysis',
	'list_sift_investigations',
	'find_error_pattern_logs',
	'find_slow_requests',
	'list_teams',
	'list_users_by_org',
	'list_all_roles',
	'get_role_details',
	'get_role_assignments',
	'list_user_roles',
	'list_team_roles',
	'get_resource_permissions',
	'get_resource_description',
	'list_pyroscope_label_names',
	'list_pyroscope_label_values',
	'list_pyroscope_profile_types',
	'fetch_pyroscope_profile',
	'get_assertions',
];

const instance = createGrafanaMcpServer({
	url: 'http://example.invalid',
	serviceAccountToken: 'test',
	enableProxiedTools: false,
});

afterAll(async () => {
	await instance.close();
});

describe('createGrafanaMcpServer', () => {
	it('registers the full upstream-aligned base tool catalog', async () => {
		await instance.initialize();
		const registered = Object.keys((instance.server as any)._registeredTools).sort();
		expect(registered).toEqual(ExpectedToolNames.slice().sort());
	});
});
