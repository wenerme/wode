import { getGlobalThis, type FetchLike, type MaybePromise } from '@wener/utils';
import { request, type OpenAiRequestOptions } from './request';
import type { DeletedObject, ImageObject, ListObject, ModelObject } from './types';

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

  async getModels() {
    return this.request<ListObject<ModelObject>>({
      url: 'models',
    });
  }

  async getModel(id: string) {
    return this.request<ModelObject>({
      url: `models/${id}`,
    });
  }

  async deleteModel(id: string) {
    return this.request<DeletedObject<'model'>>({
      method: 'DELETE',
      url: `models/${id}`,
    });
  }

  async request<T>(opts: OpenAiRequestOptions<T>) {
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
