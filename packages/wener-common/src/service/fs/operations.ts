import { defineContractOperation } from '../runtime/contract';
import { FsServiceContract as C } from './FsServiceContract';
import { FsServiceCapability } from './IFsService';

const capability = FsServiceCapability;

export const FsOperations = {
	list: defineContractOperation({ capability, contract: C.list, invoke: (s, input, o) => s.list(input, o) }),
	stat: defineContractOperation({ capability, contract: C.stat, invoke: (s, input, o) => s.stat(input, o) }),
	read: defineContractOperation({ capability, contract: C.read, invoke: (s, input, o) => s.read(input, o) }),
	write: defineContractOperation({ capability, contract: C.write, invoke: (s, input, o) => s.write(input, o) }),
	mkdir: defineContractOperation({ capability, contract: C.mkdir, invoke: (s, input, o) => s.mkdir(input, o) }),
	rm: defineContractOperation({ capability, contract: C.rm, invoke: (s, input, o) => s.rm(input, o) }),
	mv: defineContractOperation({ capability, contract: C.mv, invoke: (s, input, o) => s.mv(input, o) }),
	cp: defineContractOperation({ capability, contract: C.cp, invoke: (s, input, o) => s.cp(input, o) }),
};
