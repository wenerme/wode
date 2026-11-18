import { defineContractOperation } from '../runtime/contract';
import { GoogleAnalyticsServiceCapability } from './IGoogleAnalyticsService';
import { GoogleAnalyticsServiceContract } from './GoogleAnalyticsServiceContract';

export const GoogleAnalyticsOperations = {
	listAccountSummaries: defineContractOperation({
		capability: GoogleAnalyticsServiceCapability,
		contract: GoogleAnalyticsServiceContract.listAccountSummaries,
		invoke: (service, input, options) => service.listAccountSummaries(input, options),
	}),
	getProperty: defineContractOperation({
		capability: GoogleAnalyticsServiceCapability,
		contract: GoogleAnalyticsServiceContract.getProperty,
		invoke: (service, input, options) => service.getProperty(input, options),
	}),
	getMetadata: defineContractOperation({
		capability: GoogleAnalyticsServiceCapability,
		contract: GoogleAnalyticsServiceContract.getMetadata,
		invoke: (service, input, options) => service.getMetadata(input, options),
	}),
	runReport: defineContractOperation({
		capability: GoogleAnalyticsServiceCapability,
		contract: GoogleAnalyticsServiceContract.runReport,
		invoke: (service, input, options) => service.runReport(input, options),
	}),
	runRealtimeReport: defineContractOperation({
		capability: GoogleAnalyticsServiceCapability,
		contract: GoogleAnalyticsServiceContract.runRealtimeReport,
		invoke: (service, input, options) => service.runRealtimeReport(input, options),
	}),
};
