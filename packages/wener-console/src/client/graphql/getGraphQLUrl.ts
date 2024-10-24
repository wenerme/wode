import { getSiteStore } from '../../console/context';

export function getGraphQLUrl() {
  let url = typeof window === 'undefined' ? 'http://127.0.0.1:3000/graphql' : '/graphql';
  let site = getSiteStore().getState();
  if (typeof process === 'undefined') {
    url = site.graphqlUrl || url;
  } else {
    url = site.graphqlUrl || process.env.GRAPHQL_URL || process.env.NEXT_PUBLIC_GRAPHQL_URL || url;
  }
  if (url.startsWith('/') && typeof window !== 'undefined') {
    url = `${window.location.origin}${url}`;
  }
  return url;
}
