import type { CreateEmbeddingRequest } from './messages';
import type { ListObject } from './types';

export const CreateEmbeddingEndpoint = {
  input: undefined as CreateEmbeddingRequest | undefined,
  output: undefined as
    | (ListObject<CreateEmbeddingRequest> & {
        model: string;
        usage: {
          prompt_tokens: number;
          total_tokens: number;
        };
      })
    | undefined,
  path: 'embeddings',
};
