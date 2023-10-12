import { getGlobalThis } from '@wener/utils';

export function isWecomUserAgent(userAgent = getGlobalThis()?.navigator.userAgent || '') {
  return userAgent?.includes('wxwork');
}
