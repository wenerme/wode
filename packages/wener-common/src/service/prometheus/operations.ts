import { defineServiceOperation } from '../runtime/defineServiceOperation';
import { PrometheusToolInputs, PrometheusTools } from '../runtime/prometheus-tools';

export const PrometheusOperations = {
	query: defineServiceOperation({ capability: 'prometheus', tool: PrometheusTools.query, input: PrometheusToolInputs.query,
		invoke: (service, input, options) => service.query(input, options) }),
	queryRange: defineServiceOperation({ capability: 'prometheus', tool: PrometheusTools.queryRange, input: PrometheusToolInputs.queryRange,
		invoke: (service, input, options) => service.queryRange(input, options) }),
	series: defineServiceOperation({ capability: 'prometheus', tool: PrometheusTools.series, input: PrometheusToolInputs.series,
		invoke: (service, input, options) => service.series(input, options) }),
	labels: defineServiceOperation({ capability: 'prometheus', tool: PrometheusTools.labels, input: PrometheusToolInputs.labels,
		invoke: (service, input, options) => service.labels(input, options) }),
	labelValues: defineServiceOperation({ capability: 'prometheus', tool: PrometheusTools.labelValues, input: PrometheusToolInputs.labelValues,
		invoke: (service, input, options) => service.labelValues(input, options) }),
	metadata: defineServiceOperation({ capability: 'prometheus', tool: PrometheusTools.metadata, input: PrometheusToolInputs.metadata,
		invoke: (service, input, options) => service.metadata(input, options) }),
};
