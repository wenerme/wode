export type FetchLike<R extends RequestInit = RequestInit> = (
  url: string | URL | Request,
  init?: R,
) => Promise<Response>;
