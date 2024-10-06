import { useIpfsGatewayState } from './gateway';

export function buildIpfsLink({ gateway = useIpfsGatewayState().prefer, hash }: { gateway?: string; hash: string }) {
  return gateway.replace(':hash', hash);
}
