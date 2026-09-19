import { RemoteMethodNotImplemented } from '../client';
import { Method, Service } from '../meta';

@Service({ name: 'wks.MetaService' })
export class MetaServiceBase {
	@Method({})
	getSchema({ service: _service }: { service: string }) {
		throw new RemoteMethodNotImplemented();
	}
}
