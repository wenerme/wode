import { defineContractOperation } from '../runtime/contract';
import { TencentClsContract } from './TencentClsContract';
import { TencentClsServiceCapability } from './ITencentClsService';

export const ClsOperations = {
	query: defineContractOperation({
		capability: TencentClsServiceCapability,
		contract: TencentClsContract.query,
		invoke: (service, input, options) => service.query(input, options),
	}),
	listTopic: defineContractOperation({
		capability: TencentClsServiceCapability,
		contract: TencentClsContract.listTopic,
		invoke: (service, input, options) => service.listTopic(input, options),
	}),
};
