import { getGlobalThis } from '@wener/utils';

export function getRedirectUri(u?: string) {
  u ||= getGlobalThis().location?.href;
  if (!u) {
    return;
  }
  let url = new URL(u);
  url.search = '';
  url.hash = '';
  return url.toString();
}
