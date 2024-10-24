import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import request from 'graphql-request';
import { getAccessToken } from '../../console/context';
import { getGraphQLUrl } from './getGraphQLUrl';

export function gqlr<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
) {
  let token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return request({
    url: getGraphQLUrl(),
    document: document,
    variables: variables ?? undefined,
    requestHeaders: headers,
  });
}
