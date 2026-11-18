import { defineContractOperation } from '../runtime/contract';
import { PrometheusServiceContract } from './PrometheusServiceContract';
import { PrometheusServiceCapability } from './IPrometheusService';

export const PrometheusOperations = {
	query: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusServiceContract.query,
		invoke: (service, input, options) => service.query(input, options),
	}),
	queryRange: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusServiceContract.queryRange,
		invoke: (service, input, options) => service.queryRange(input, options),
	}),
	series: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusServiceContract.series,
		invoke: (service, input, options) => service.series(input, options),
	}),
	labels: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusServiceContract.labels,
		invoke: (service, input, options) => service.labels(input, options),
	}),
	labelValues: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusServiceContract.labelValues,
		invoke: (service, input, options) => service.labelValues(input, options),
	}),
	metadata: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusServiceContract.metadata,
		invoke: (service, input, options) => service.metadata(input, options),
	}),
};
