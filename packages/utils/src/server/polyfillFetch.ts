export async function polyfillFetch() {
  if ('fetch' in globalThis) {
    return false;
  }
  const {
    default: fetch,
    Response,
    Headers,
    Request,
    AbortError,
    FetchError,
    FormData,
    Blob,
    File,
    // @ts-ignore
  } = await import('node-fetch');
  Object.assign(globalThis, {
    fetch,
    Response,
    Headers,
    Request,
    AbortError,
    FetchError,
    FormData,
    Blob,
    File,
  });
  return true;
}
