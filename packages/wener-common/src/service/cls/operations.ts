import { defineContractOperation } from '../runtime/contract';
import { TencentClsServiceContract } from './TencentClsServiceContract';
import { TencentClsServiceCapability } from './ITencentClsService';

export const ClsOperations = {
	query: defineContractOperation({
		capability: TencentClsServiceCapability,
		contract: TencentClsServiceContract.query,
		invoke: (service, input, options) => service.query(input, options),
	}),
	listTopic: defineContractOperation({
		capability: TencentClsServiceCapability,
		contract: TencentClsServiceContract.listTopic,
		invoke: (service, input, options) => service.listTopic(input, options),
	}),
};
