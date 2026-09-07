// Code generated from Tencent Docs API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * Tencent Docs MCP API
 * @see https://docs.qq.com/open/document/mcp/tool-introduce/
 */
export const PostMcpToolCallRequestSchema = z.object({
  /** Protocol version, default "2.0" */
  jsonrpc: z.string().default('"2.0"'),
  /** Request ID */
  id: z.number(),
  /** Method name, default "tools/call" */
  method: z.string().default('"tools/call"'),
  /** Tool call parameters (CallToolParams object) */
  params: z.object({ name: z.string(), arguments: z.record(z.string(), z.any()) }),
});
export type PostMcpToolCallRequest = z.infer<typeof PostMcpToolCallRequestSchema>;
export const PostMcpToolCallResponseSchema = z.object({
  /** Protocol version */
  jsonrpc: z.string().optional(),
  /** Request ID */
  id: z.number().optional(),
  /** Normal return result (varies by tool) */
  result: z.object({ content: z.object({ type: z.string(), text: z.string() }), node_info: z.object({ node_id: z.string(), title: z.string(), node_type: z.string(), has_child: z.boolean(), doc_type: z.string(), url: z.string() }), children: z.object({ node_id: z.string(), title: z.string(), node_type: z.string(), has_child: z.boolean() }), nodes: z.object({ node_id: z.string(), title: z.string() }), has_next: z.boolean(), update_num: z.number(), file_id: z.string(), url: z.string(), error: z.string() }).optional(),
  /** Error object if failed */
  error: z.object({ code: z.number(), message: z.string() }).optional(),
});
export type PostMcpToolCallResponse = z.infer<typeof PostMcpToolCallResponseSchema>;
