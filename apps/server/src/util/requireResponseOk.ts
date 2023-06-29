export function requireResponseOk(res: Response) {
  if (!res.ok) {
    throw new Error(`unexpected response ${res.status} ${res.statusText}`, { cause: res });
  }
  return res;
}
