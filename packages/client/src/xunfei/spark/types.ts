export interface RequestPayload {
  header: {
    app_id?: string;
    uid?: string; // max 32
  };
  parameter: {
    chat: {
      domain: string;
      temperature?: number; // 0-1, default 0.5
      max_tokens?: number; // 1,4096 default 2048
      top_k?: number; // 1-6, default 4
      chat_id?: string;
    };
  };
  payload: {
    message: {
      text: Array<{
        role: 'user' | 'assistant';
        content: string;
      }>;
    };
  };
}

export interface ResponsePayload {
  header: {
    code: number; // 0 success
    message: string;
    sid: string;
    status: number; // 0 first, 1 continue, 2 end
  };
  payload: {
    choices: {
      status: number; // 0 first, 1 continue, 2 end
      seq: number;
      text: Array<{
        content: string;
        role: 'user' | 'assistant';
        index: number;
      }>;
    };
    usage: {
      text: {
        question_tokens: number;
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };
  };
}
