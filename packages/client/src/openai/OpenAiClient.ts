import { FetchLike, getGlobalThis, MaybePromise } from '@wener/utils';
import { CreateEmbeddingRequest } from './messages';
import { OpenAiRequestOptions, request } from './request';
import { DeletedObject, ImageObject, ListObject, ModelObject } from './types';

export interface OpenAiClientOptions {
  fetch: FetchLike;
  baseUrl: string;
  onImage: (v: ImageObject) => MaybePromise<ImageObject>;
  headers: Record<string | 'OpenAI-Organization' | 'Authorization', any>;
}

export interface OpenAiClientInit extends Partial<OpenAiClientOptions> {}

/**
 * @see https://platform.openai.com/docs/api-reference
 */
export class OpenAiClient {
  readonly options: OpenAiClientOptions;

  constructor({
    fetch = getGlobalThis().fetch,
    baseUrl = 'https://api.openai.com/v1/',
    onImage = (v) => v,
    headers = {},
    ...base
  }: OpenAiClientInit) {
    this.options = {
      ...base,
      fetch,
      baseUrl,
      onImage,
      headers,
    };
  }

  getModels() {
    return this.request<ListObject<ModelObject>>({
      url: 'models',
    });
  }

  getModel(id: string) {
    return this.request<ModelObject>({
      url: `models/${id}`,
    });
  }

  deleteModel(id: string) {
    return this.request<DeletedObject<'model'>>({
      method: 'DELETE',
      url: `models/${id}`,
    });
  }

  request<T>(opts: OpenAiRequestOptions<T>) {
    const { fetch, baseUrl, headers } = this.options;
    return request({
      fetch,
      baseUrl,
      ...opts,
      headers: {
        ...headers,
        ...opts.headers,
      },
    });
  }
}
