import type { GrafanaContext } from '../server';
import { registerAdminTools } from './admin';
import { registerAlertingTools } from './alerting';
import { registerAnnotationTools } from './annotations';
import { registerAssertsTools } from './asserts';
import { registerClickHouseTools } from './clickhouse';
import { registerCloudWatchTools } from './cloudwatch';
import { registerDashboardTools } from './dashboard';
import { registerDatasourceTools } from './datasource';
import { registerElasticSearchTools } from './elasticsearch';
import { registerExampleTools } from './examples';
import { registerFolderTools } from './folder';
import { registerIncidentTools } from './incident';
import { registerLokiTools } from './loki';
import { registerNavigationTools } from './navigation';
import { registerOnCallTools } from './oncall';
import { registerPrometheusTools } from './prometheus';
import { registerPyroscopeTools } from './pyroscope';
import { registerRenderingTools } from './rendering';
import { registerRunPanelQueryTools } from './runpanelquery';
import { registerSearchTools } from './search';
import { registerSearchLogsTools } from './searchlogs';
import { registerSiftTools } from './sift';
import { registerSystemTools } from './system';

type ToolGroupRegistration = {
	name: string;
	register: (ctx: GrafanaContext) => void;
};

const ToolGroups: ToolGroupRegistration[] = [
	{ name: 'system', register: registerSystemTools },
	{ name: 'search', register: registerSearchTools },
	{ name: 'datasource', register: registerDatasourceTools },
	{ name: 'dashboard', register: registerDashboardTools },
	{ name: 'folder', register: registerFolderTools },
	{ name: 'navigation', register: registerNavigationTools },
	{ name: 'annotations', register: registerAnnotationTools },
	{ name: 'rendering', register: registerRenderingTools },
	{ name: 'examples', register: registerExampleTools },
	{ name: 'prometheus', register: registerPrometheusTools },
	{ name: 'loki', register: registerLokiTools },
	{ name: 'elasticsearch', register: registerElasticSearchTools },
	{ name: 'cloudwatch', register: registerCloudWatchTools },
	{ name: 'clickhouse', register: registerClickHouseTools },
	{ name: 'runpanelquery', register: registerRunPanelQueryTools },
	{ name: 'searchlogs', register: registerSearchLogsTools },
	{ name: 'alerting', register: registerAlertingTools },
	{ name: 'incident', register: registerIncidentTools },
	{ name: 'oncall', register: registerOnCallTools },
	{ name: 'sift', register: registerSiftTools },
	{ name: 'admin', register: registerAdminTools },
	{ name: 'pyroscope', register: registerPyroscopeTools },
	{ name: 'asserts', register: registerAssertsTools },
];

function isEnabled(ctx: GrafanaContext, name: string) {
	const normalized = name.toLowerCase();
	if (ctx.enabledToolGroups && !ctx.enabledToolGroups.has(normalized)) return false;
	if (ctx.disabledToolGroups?.has(normalized)) return false;
	return true;
}

export function registerGrafanaToolGroups(ctx: GrafanaContext) {
	for (const group of ToolGroups) {
		if (!isEnabled(ctx, group.name)) continue;
		group.register(ctx);
	}
}

export { registerSystemTools } from './system';
export { registerDatasourceTools } from './datasource';
export { registerDashboardTools } from './dashboard';
