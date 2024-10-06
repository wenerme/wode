export function isValidMethodName(name: string) {
  if (!name) {
    return false;
  }
  return /^[a-z][a-z0-9_]*$/i.test(name);
}

export function isValidServiceName(name: string) {
  if (!name) {
    return false;
  }
  return name.split('.').every((v) => isValidMethodName(v));
}
