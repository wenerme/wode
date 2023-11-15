export interface OpenAiClientAgent {
  type?: 'OpenAi';
  secrets: {
    key: string;
    organization?: string;
    endpoint?: string;
  };
  config: {
    defaults?: Record<string, Record<string, any>>;
    overrides?: Record<string, Record<string, any>>;
  };
}
