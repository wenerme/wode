import { getAppState } from '@/state/AppStore';

let _getAccessToken: () => string | undefined | null = () => getAppState().auth.accessToken;

export function setAccessTokenProvider(f: () => string | undefined | null) {
  _getAccessToken = f;
}

export function getAccessToken() {
  return _getAccessToken();
}
