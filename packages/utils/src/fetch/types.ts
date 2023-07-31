export type FetchLike<R extends RequestInit = RequestInit> = (url: string | Request, init?: R) => Promise<Response>;
