import { getAppState } from '../../console';

export function getGraphQLUrl() {
  let url = typeof window === 'undefined' ? 'http://127.0.0.1:3000/graphql' : '/graphql';
  if (typeof process === 'undefined') {
    url = getAppState().graphql.url || url;
  } else {
    url = getAppState().graphql.url || process.env.GRAPHQL_URL || process.env.NEXT_PUBLIC_GRAPHQL_URL || url;
  }

  if (url.startsWith('/') && typeof window !== 'undefined') {
    url = `${window.location.origin}${url}`;
  }
  return url;
}
