import { type ChatParameter } from './schema';

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface ChatClient {
  ping?: (req: ChatRequest, opts?: RequestOptions) => Promise<void>;

  chat(req: ChatRequest, opts?: RequestOptions): Promise<AsyncIterableIterator<ChatResponse>>;
}

export interface ChatRequest extends ChatParameter {}

export interface ChatResponse {
  role: string;
  content: string;
  usage?: any;
}
