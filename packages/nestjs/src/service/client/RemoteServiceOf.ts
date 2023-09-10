import type { AbstractConstructor, Constructor } from '../../types';
import { getServiceName, ServiceNameProp } from '../decorator';
import type { RemoteService } from './types';

/**
 * create inject token for service
 */
export function RemoteServiceOf<T>(base: Constructor<T> | AbstractConstructor<T>): Constructor<RemoteService<T>> {
  const Base = base as Constructor<any>;
  return class RemoteService extends Base {
    static [ServiceNameProp] = getServiceName(base);

    toString() {
      return `${RemoteService.name}(${RemoteService[ServiceNameProp]})`;
    }

    toJSON() {
      return this.toString();
    }
  } as any;
}
