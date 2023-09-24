import { z } from 'zod';

export const ChatMessageRoleSchema = z.enum(['system', 'user', 'assistant']);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

export const ChatMessageSchema = z.object({
  role: ChatMessageRoleSchema.default('user'),
  content: z.string().nonempty(),
  name: z.string().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatParameterSchema = z.object({
  model: z.string().optional(),
  messages: z.array(ChatMessageSchema).default([]).optional(),
  temperature: z.coerce.number().optional(),
  topP: z.coerce.number().optional(),
  n: z.coerce.number().optional(),
  stream: z.boolean().optional(),
  stop: z.string().array().optional(),
  maxTokens: z.coerce.number().optional(),
  presencePenalty: z.coerce.number().optional(),
  frequencyPenalty: z.coerce.number().optional(),
  logitBias: z.record(z.any()).optional(),
  user: z.string().optional(),
});
export type ChatParameter = z.infer<typeof ChatParameterSchema>;
