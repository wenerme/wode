export interface FetchLikeRequest {
	clone(): unknown;
}

export type FetchLikeInput = string | URL | FetchLikeRequest;

export type FetchLike<R extends RequestInit = RequestInit> = {
	bivarianceHack(url: FetchLikeInput, init?: R): Promise<Response>;
}['bivarianceHack'];
