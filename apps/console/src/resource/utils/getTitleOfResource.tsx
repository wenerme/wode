export function getTitleOfResource(res?: any) {
  if (res && typeof res === 'object') {
    return res.displayName || res.title || res.fullName || res.loginName || res.topic;
  }
  return undefined;
}
