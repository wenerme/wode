import { proxyWithPersist } from 'common/src/valtio';

export function getFallbackGateway() {
  return 'https://ipfs.io/ipfs/:hash';
}

export function getRecommendGateways() {
  return ['https://ipfs.io/ipfs/:hash', 'https://cloudflare-ipfs.com/ipfs/:hash'];
}

export interface IpfsGatewayState {
  prefer: string;
}

export function useIpfsGatewayState(): IpfsGatewayState {
  // eslint-disable-next-line no-return-assign
  return ((globalThis as any).IpfsGatewayState ||= proxyWithPersist({
    key: 'IpfsGatewayState',
    initialState: {
      prefer: getFallbackGateway(),
    },
  }));
}
