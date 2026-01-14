import { Injectable } from '@nestjs/common';
import { App } from '../../app';
import { RemoteMethodNotImplemented, RemoteServiceOf } from '../client';
import { Method, Service } from '../meta';
import { ExposeService, type LocalService } from '../server';

@Service({ name: 'wks.InstanceService' })
export class InstanceServiceStub {
	@Method({})
	getInstanceId(_req: unknown): string {
		throw new RemoteMethodNotImplemented();
	}
}

export class RemoteInstanceService extends RemoteServiceOf(InstanceServiceStub) {}

type LocalInstanceService = LocalService<InstanceServiceStub>;

@ExposeService({ as: InstanceServiceStub })
@Injectable()
export class InstanceService implements LocalInstanceService {
	@Method({})
	getInstanceId(_req: unknown) {
		return App.instanceId;
	}
}
