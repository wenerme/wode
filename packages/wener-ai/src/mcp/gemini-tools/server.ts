import type { GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import consola from 'consola';
import { z } from 'zod';
import type { McpServerInstance } from '../McpServerDef';

const log = consola.withTag('gemini-tools-mcp');

export interface CreateGeminiToolsMcpServerOptions {
	name?: string;
	version?: string;
	apiKey?: string;
	/** Google Gemini API base URL. For PPIO: 'https://api.ppinfra.com/gemini/v1beta/models' */
	baseUrl?: string;
	model?: string;
}

const URL_PATTERN = /https?:\/\/[^\s"'<>]+/i;

export function createGeminiToolsMcpServer(options: CreateGeminiToolsMcpServerOptions = {}): McpServerInstance {
	const { name = 'gemini-tools', version = '1.0.0' } = options;
	const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
	const baseUrl = options.baseUrl || process.env.GEMINI_BASE_URL;
	const model = options.model || process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
	const server = new McpServer({ name, version });

	server.tool(
		'web_search',
		'Search the internet for latest information using Google Search grounding. If query contains URLs, URL context analysis is also enabled.',
		{
			query: z.string().describe('Search query, may include URLs for context analysis'),
			lang: z.string().optional().describe('Response language (e.g. zh, en). Auto-detected from query by default'),
		},
		async ({ query, lang }) => {
			if (!apiKey) {
				return {
					isError: true,
					content: [{ type: 'text' as const, text: 'Error: GEMINI_API_KEY not configured' }],
				};
			}
			try {
				const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
				const { generateText } = await import('ai');

				const google = createGoogleGenerativeAI({
					apiKey,
					...(baseUrl ? { baseURL: baseUrl } : {}),
				});

				const hasUrl = URL_PATTERN.test(query);
				const tools: Record<string, any> = {
					google_search: google.tools.googleSearch({}),
				};
				if (hasUrl) {
					tools.url_context = google.tools.urlContext({});
					log.info('URL detected in query, enabling url_context');
				}

				const langHint = lang ? `\nRespond in ${lang}.` : '';
				const { text, sources, providerMetadata } = await generateText({
					model: google(model),
					tools,
					toolChoice: 'required',
					prompt: `${query}${langHint}`,
				});

				const metadata = providerMetadata?.google as GoogleGenerativeAIProviderMetadata | undefined;
				const grounding = metadata?.groundingMetadata as GroundingMetadataInput['grounding'];
				const urlContext = metadata?.urlContextMetadata as GroundingMetadataInput['urlContext'];

				const content: Array<{ type: 'text'; text: string }> = [
					{ type: 'text' as const, text: text || 'No results found.' },
				];

				if (grounding || urlContext || sources?.length) {
					content.push({
						type: 'text' as const,
						text: formatGroundingMetadata({ grounding, urlContext, sources }),
					});
				}

				return { content };
			} catch (e) {
				log.error('web_search error:', e);
				return {
					isError: true,
					content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
				};
			}
		},
	);

	server.tool(
		'code_execution',
		'Generate and execute Python code using Gemini code execution. Useful for calculations, data analysis, and algorithmic tasks.',
		{
			prompt: z.string().describe('Task description for the model to solve by writing and running Python code'),
			lang: z.string().optional().describe('Response language (e.g. zh, en)'),
		},
		async ({ prompt, lang }) => {
			if (!apiKey) {
				return {
					isError: true,
					content: [{ type: 'text' as const, text: 'Error: GEMINI_API_KEY not configured' }],
				};
			}
			try {
				const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
				const { generateText } = await import('ai');

				const google = createGoogleGenerativeAI({
					apiKey,
					...(baseUrl ? { baseURL: baseUrl } : {}),
				});

				const langHint = lang ? `\nRespond in ${lang}.` : '';
				const result = await generateText({
					model: google(model),
					tools: {
						code_execution: google.tools.codeExecution(),
					},
					toolChoice: 'required',
					prompt: `${prompt}${langHint}`,
				});

				const content: Array<{ type: 'text'; text: string }> = [];

				// Extract code and execution results from steps
				for (const step of result.steps) {
					for (const tc of step.toolCalls) {
						if (tc.toolName === 'code_execution') {
							const input = typeof tc.input === 'string' ? JSON.parse(tc.input) : tc.input;
							if (input?.code) {
								content.push({
									type: 'text' as const,
									text: `\`\`\`${input.language || 'python'}\n${input.code}\n\`\`\``,
								});
							}
						}
					}
					for (const tr of step.toolResults) {
						if (tr.toolName === 'code_execution') {
							const res = tr.result as { outcome?: string; output?: string };
							if (res?.output) {
								content.push({
									type: 'text' as const,
									text: `**Execution Output** (${res.outcome || 'unknown'}):\n\`\`\`\n${res.output}\n\`\`\``,
								});
							}
						}
					}
				}

				if (result.text) {
					content.push({ type: 'text' as const, text: result.text });
				}

				if (content.length === 0) {
					content.push({ type: 'text' as const, text: 'Code execution completed with no output.' });
				}

				return { content };
			} catch (e) {
				log.error('code_execution error:', e);
				return {
					isError: true,
					content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
				};
			}
		},
	);

	return {
		server,
		async close() {
			await server.close();
		},
	};
}

interface GroundingMetadataInput {
	grounding?: {
		webSearchQueries?: string[];
		groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
		groundingSupports?: Array<{
			segment?: { text?: string; startIndex?: number; endIndex?: number };
			groundingChunkIndices?: number[];
			supportChunkIndices?: number[];
		}>;
	};
	urlContext?: {
		urlMetadata?: Array<{ retrievedUrl?: string; urlRetrievalStatus?: string }>;
	};
	sources?: Array<{ sourceType: string; id: string; url?: string; title?: string; providerMetadata?: unknown }>;
}

function formatGroundingMetadata({ grounding, urlContext, sources }: GroundingMetadataInput) {
	const lines: string[] = ['', '---', '### Grounding Metadata'];

	if (grounding?.webSearchQueries?.length) {
		lines.push('', '**Search Queries:**');
		for (const q of grounding.webSearchQueries) {
			lines.push(`- ${q}`);
		}
	}

	const chunks = grounding?.groundingChunks;
	if (chunks?.length) {
		lines.push('', '**Sources:**');
		for (const chunk of chunks) {
			if (chunk.web) {
				const title = chunk.web.title || 'link';
				const uri = chunk.web.uri || '';
				lines.push(`- [${title}](${uri})`);
			}
		}
	}

	if (grounding?.groundingSupports?.length) {
		lines.push('', '**Citations:**');
		for (const support of grounding.groundingSupports) {
			const text = support.segment?.text;
			if (!text) continue;
			const refIndices = support.groundingChunkIndices || support.supportChunkIndices || [];
			const refs = refIndices
				.map((i) => {
					const c = chunks?.[i];
					return c?.web?.title || `[${i + 1}]`;
				})
				.join(', ');
			const snippet = text.length > 120 ? `${text.slice(0, 120)}...` : text;
			lines.push(`- > ${snippet}`);
			if (refs) lines.push(`  Sources: ${refs}`);
		}
	}

	if (urlContext?.urlMetadata?.length) {
		lines.push('', '**URL Context:**');
		for (const u of urlContext.urlMetadata) {
			lines.push(`- ${u.retrievedUrl} (${u.urlRetrievalStatus})`);
		}
	}

	if (sources?.length) {
		lines.push('', '**References:**');
		for (const s of sources) {
			const title = s.title || 'link';
			const url = s.url || '';
			lines.push(`- [${title}](${url})`);
		}
	}

	return lines.join('\n');
}
