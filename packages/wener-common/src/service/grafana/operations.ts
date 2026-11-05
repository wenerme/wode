import { defineServiceOperation } from '../runtime/defineServiceOperation';
import { GrafanaToolInputs, GrafanaTools } from '../runtime/grafana-tools';

export const GrafanaOperations = {
	health: defineServiceOperation({ capability: 'grafana', tool: GrafanaTools.health, input: GrafanaToolInputs.health,
		invoke: (service, _input, options) => service.health(options) }),
	whoAmI: defineServiceOperation({ capability: 'grafana', tool: GrafanaTools.whoAmI, input: GrafanaToolInputs.whoAmI,
		invoke: (service, _input, options) => service.whoAmI(options) }),
	request: defineServiceOperation({ capability: 'grafana', tool: GrafanaTools.request, input: GrafanaToolInputs.request,
		invoke: (service, input, options) => service.request(input, options) }),
};
