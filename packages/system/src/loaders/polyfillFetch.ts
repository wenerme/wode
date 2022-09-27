export async function polyfillFetch() {
  if (typeof globalThis.fetch === 'undefined') {
    const { default: fetch } = await import('node-fetch');
    const { Response, Headers, Request, AbortError, FetchError, FormData, Blob, File } = await import('node-fetch');
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
  }
}
