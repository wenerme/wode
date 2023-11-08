// https://sinclairzx81.github.io/typebox-workbench/

export type ListObject<T> = {
  object: 'list';
  data: Array<T>;
};

export type ImageObject =
  | {
      url: string;
      revised_prompt: string;
    }
  | {
      b64_json: string;
      revised_prompt: string;
    };

export type ModelObject = {
  id: string;
  object: 'model';
  created: number;
  owned_by: 'openai' | string;
};

export type AssistantObject = {
  id: string;
  object: 'assistant';
  created_at: number;
  name: string | null;
  description: string | null;
  model: string;
  instructions: string | null;
  tools: Array<
    | {
        type: 'code_interpreter';
      }
    | {
        type: 'retrieval';
      }
    | {
        type: 'function';
        function: {
          name: string;
          description: string;
          parameters: Record<string, any>;
        };
      }
  >;
  file_ids: Array<string>;
  metadata: Record<string, any>;
};

export interface ChatCompletionObjectChoiceMessage {
  role: string;
  content: string;
}

export interface ChatCompletionObjectChoice {
  index: number;
  message: ChatCompletionObjectChoiceMessage;
  finish_reason: string;
}

export interface ChatCompletionObjectUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionObject {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  system_fingerprint: string;
  choices: ChatCompletionObjectChoice[];
  usage: ChatCompletionObjectUsage;
}

export interface ChatCompletionChunkObjectChoiceDelta {
  role: string;
  content: string;
  /**
   * @deprecated
   */
  function_call?: any;
  tool_calls?: Array<{
    index: number;
    id: string;
    type: string | 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface ChatCompletionChunkObjectChoice {
  index: number;
  delta: ChatCompletionChunkObjectChoiceDelta;
  finish_reason: null | 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'function_call';
}

export interface ChatCompletionChunkObject {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  system_fingerprint: string;
  choices: ChatCompletionChunkObjectChoice[];
}
