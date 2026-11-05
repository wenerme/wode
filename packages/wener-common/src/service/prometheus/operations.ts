import { defineContractOperation } from '../runtime/contract';
import { PrometheusContract } from './PrometheusContract';
import { PrometheusServiceCapability } from './IPrometheusService';

export const PrometheusOperations = {
	query: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusContract.query,
		invoke: (service, input, options) => service.query(input, options),
	}),
	queryRange: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusContract.queryRange,
		invoke: (service, input, options) => service.queryRange(input, options),
	}),
	series: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusContract.series,
		invoke: (service, input, options) => service.series(input, options),
	}),
	labels: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusContract.labels,
		invoke: (service, input, options) => service.labels(input, options),
	}),
	labelValues: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusContract.labelValues,
		invoke: (service, input, options) => service.labelValues(input, options),
	}),
	metadata: defineContractOperation({
		capability: PrometheusServiceCapability,
		contract: PrometheusContract.metadata,
		invoke: (service, input, options) => service.metadata(input, options),
	}),
};
