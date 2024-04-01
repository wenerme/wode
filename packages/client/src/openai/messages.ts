export type CreateEmbeddingRequest = {
  input: string | string[];
  model: string;
  encoding_format?: 'float' | 'base64';
  user?: string;
};
