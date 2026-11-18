import { defineContractOperation } from '../runtime/contract';
import { S3ServiceContract } from './S3ServiceContract';
import { S3ServiceCapability } from './IS3Service';

export const S3Operations = {
	listObject: defineContractOperation({
		capability: S3ServiceCapability,
		contract: S3ServiceContract.listObject,
		invoke: (service, input, options) => service.listObject(input, options),
	}),
	getObject: defineContractOperation({
		capability: S3ServiceCapability,
		contract: S3ServiceContract.getObject,
		invoke: (service, input, options) => service.getObject(input, options),
	}),
	putObject: defineContractOperation({
		capability: S3ServiceCapability,
		contract: S3ServiceContract.putObject,
		invoke: (service, input, options) => service.putObject(input, options),
	}),
	deleteObject: defineContractOperation({
		capability: S3ServiceCapability,
		contract: S3ServiceContract.deleteObject,
		invoke: (service, input, options) => service.deleteObject(input, options),
	}),
};
