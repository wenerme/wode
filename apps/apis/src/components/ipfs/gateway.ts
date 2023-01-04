import { proxyWithCompare } from 'common/src/valtio';
import { subscribe } from 'valtio';

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
  return ((globalThis as any).IpfsGatewayState ||= (() => {
    let initialState = {};
    try {
      initialState = JSON.parse(globalThis?.localStorage.getItem('IpfsGatewayState') || '{}');
    } catch (e) {}
    const state = proxyWithCompare({
      prefer: getFallbackGateway(),
      ...initialState,
    });
    if (globalThis?.localStorage) {
      subscribe(state, () => {
        globalThis?.localStorage.setItem('IpfsGatewayState', JSON.stringify(state));
      });
    }
    return state;
  })());
}
