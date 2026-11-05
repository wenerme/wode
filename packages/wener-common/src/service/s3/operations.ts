import { defineContractOperation } from '../runtime/contract';
import { S3Contract } from './S3Contract';
import { S3ServiceCapability } from './IS3Service';

export const S3Operations = {
	listObject: defineContractOperation({
		capability: S3ServiceCapability,
		contract: S3Contract.listObject,
		invoke: (service, input, options) => service.listObject(input, options),
	}),
	getObject: defineContractOperation({
		capability: S3ServiceCapability,
		contract: S3Contract.getObject,
		invoke: (service, input, options) => service.getObject(input, options),
	}),
	putObject: defineContractOperation({
		capability: S3ServiceCapability,
		contract: S3Contract.putObject,
		invoke: (service, input, options) => service.putObject(input, options),
	}),
	deleteObject: defineContractOperation({
		capability: S3ServiceCapability,
		contract: S3Contract.deleteObject,
		invoke: (service, input, options) => service.deleteObject(input, options),
	}),
};
