import type { DescService } from '@bufbuild/protobuf';
import type { ServiceImpl } from '@connectrpc/connect';

export function createService<T extends DescService>(
  service: T,
  implementation: Partial<ServiceImpl<T>>,
  options?: Partial<{}>,
) {
  return [service, implementation, options] as const;
}
