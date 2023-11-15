export function parseAuthorization(authorization: string | undefined | null): [string | undefined, string | undefined] {
  if (!authorization) {
    return [undefined, undefined];
  }
  let idx = authorization.indexOf(' ');
  if (idx === -1) {
    return [undefined, authorization];
  }
  let type = authorization.slice(0, idx);
  let token = authorization.slice(idx + 1);
  // empty to undefined
  return [type || undefined, token.trim() || undefined];
}
