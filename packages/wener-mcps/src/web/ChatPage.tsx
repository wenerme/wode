'use client';

import { Combobox } from '@base-ui/react/combobox';
import { cjk } from '@streamdown/cjk';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import {
	Brain,
	Check,
	ChevronDown,
	ChevronUp,
	Clock,
	Copy,
	Edit2,
	ImagePlus,
	Menu,
	MessageSquarePlus,
	RefreshCw,
	Send,
	Settings,
	Square,
	Trash2,
	Wrench,
	X,
	XCircle,
	Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, memo, type KeyboardEvent } from 'react';
import { Streamdown } from 'streamdown';

// Types
interface ToolCall {
	id: string;
	name: string;
	arguments: Record<string, unknown>;
	result?: unknown;
	error?: string;
	status: 'pending' | 'running' | 'completed' | 'error';
}

interface ImageContent {
	type: 'image';
	url: string;
	base64?: string;
}

interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	images?: ImageContent[];
	reasoning?: string;
	toolCalls?: ToolCall[];
	createdAt?: Date;
	error?: string;
	usage?: {
		promptTokens?: number;
		completionTokens?: number;
		totalTokens?: number;
	};
	durationMs?: number;
}

interface ChatSession {
	id: string;
	title: string;
	model: string;
	messages: Message[];
	createdAt: Date;
	updatedAt: Date;
}

interface ModelItem {
	id: string;
	value: string;
	adapter?: string;
	baseUrl?: string;
}

interface McpServer {
	name: string;
	type: string;
}

interface ChatSettings {
	temperature: number;
	topP: number;
	topK: number;
	maxTokens: number;
	mcpServers: string[];
}

// Streamdown Markdown component
const MarkdownContent = memo(
	({ children, className }: { children: string; className?: string }) => (
		<Streamdown className={className} plugins={{ code, math, cjk }}>
			{children}
		</Streamdown>
	),
	(prev, next) => prev.children === next.children,
);
MarkdownContent.displayName = 'MarkdownContent';

// Tool Call Display
function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className='border border-base-300 rounded-lg my-2 overflow-hidden bg-base-100'>
			<button
				type='button'
				className='w-full flex items-center justify-between p-2 hover:bg-base-200'
				onClick={() => setIsOpen(!isOpen)}
			>
				<div className='flex items-center gap-2'>
					{toolCall.status === 'completed' ? (
						<Check className='w-3.5 h-3.5 text-success' />
					) : toolCall.status === 'error' ? (
						<XCircle className='w-3.5 h-3.5 text-error' />
					) : (
						<Clock className='w-3.5 h-3.5 text-warning animate-pulse' />
					)}
					<Wrench className='w-3.5 h-3.5 text-base-content/60' />
					<span className='font-mono text-sm'>{toolCall.name}</span>
				</div>
				{isOpen ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
			</button>
			{isOpen && (
				<div className='p-2 space-y-2 text-xs border-t border-base-300'>
					<div>
						<div className='font-semibold text-base-content/70 mb-1'>Arguments:</div>
						<pre className='bg-base-200 p-2 rounded overflow-auto max-h-32'>
							{JSON.stringify(toolCall.arguments, null, 2)}
						</pre>
					</div>
					{toolCall.result !== undefined && (
						<div>
							<div className='font-semibold text-base-content/70 mb-1'>Result:</div>
							<pre className='bg-base-200 p-2 rounded overflow-auto max-h-32'>
								{typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}
							</pre>
						</div>
					)}
					{toolCall.error && (
						<div>
							<div className='font-semibold text-error mb-1'>Error:</div>
							<pre className='bg-error/10 text-error p-2 rounded'>{toolCall.error}</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// Reasoning/Thinking Display
function ReasoningDisplay({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<div className='border border-base-300 rounded-lg my-2 overflow-hidden bg-base-100'>
			<button
				type='button'
				className='w-full flex items-center justify-between p-2 hover:bg-base-200'
				onClick={() => setIsOpen(!isOpen)}
			>
				<div className='flex items-center gap-2 text-base-content/70'>
					<Brain className={`w-4 h-4 ${isStreaming ? 'animate-pulse' : ''}`} />
					<span className='text-sm'>{isStreaming ? 'Thinking...' : 'Reasoning'}</span>
				</div>
				{isOpen ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
			</button>
			{isOpen && (
				<div className='p-3 text-sm text-base-content/80 prose prose-sm max-w-none border-t border-base-300'>
					<MarkdownContent>{content || '...'}</MarkdownContent>
				</div>
			)}
		</div>
	);
}

// Helper functions
function generateSessionId() {
	return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateTitle(messages: Message[]): string {
	const firstUserMessage = messages.find((m) => m.role === 'user');
	if (firstUserMessage) {
		const content = firstUserMessage.content.slice(0, 50);
		return content.length < firstUserMessage.content.length ? `${content}...` : content;
	}
	return 'New Chat';
}

function loadSessions(): ChatSession[] {
	try {
		const data = localStorage.getItem('mcps-chat-sessions');
		if (data) return JSON.parse(data);
	} catch (e) {
		console.error('Failed to load sessions:', e);
	}
	return [];
}

function saveSessions(sessions: ChatSession[]) {
	try {
		localStorage.setItem('mcps-chat-sessions', JSON.stringify(sessions));
	} catch (e) {
		console.error('Failed to save sessions:', e);
	}
}

function loadSettings(): ChatSettings {
	try {
		const data = localStorage.getItem('mcps-chat-settings');
		if (data) return { ...defaultSettings, ...JSON.parse(data) };
	} catch (e) {
		console.error('Failed to load settings:', e);
	}
	return defaultSettings;
}

function saveSettings(settings: ChatSettings) {
	try {
		localStorage.setItem('mcps-chat-settings', JSON.stringify(settings));
	} catch (e) {
		console.error('Failed to save settings:', e);
	}
}

const defaultSettings: ChatSettings = {
	temperature: 0.7,
	topP: 1.0,
	topK: 40,
	maxTokens: 4096,
	mcpServers: [],
};

export function ChatPage() {
	const [models, setModels] = useState<ModelItem[]>([]);
	const [selectedModel, setSelectedModel] = useState<string>('');
	const [input, setInput] = useState('');
	const [images, setImages] = useState<ImageContent[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
	const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
	const [showSidebar, setShowSidebar] = useState(true);
	const [showSettings, setShowSettings] = useState(false);
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [editContent, setEditContent] = useState('');
	const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
	const [settings, setSettings] = useState<ChatSettings>(() => loadSettings());
	const [inputHistory, setInputHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const currentSession = sessions.find((s) => s.id === currentSessionId);
	const messages = currentSession?.messages || [];

	useEffect(() => {
		saveSessions(sessions);
	}, [sessions]);

	useEffect(() => {
		saveSettings(settings);
	}, [settings]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	useEffect(() => {
		fetch('/api/mcps/models')
			.then((res) => res.json())
			.then((data) => {
				const modelList = (data.models || []) as { name: string; adapter?: string; baseUrl?: string }[];
				const validModels: ModelItem[] = modelList
					.filter((m) => !m.name.includes('*'))
					.map((m) => ({
						id: m.name,
						value: m.name,
						adapter: m.adapter || undefined,
						baseUrl: m.baseUrl || undefined,
					}));
				setModels(validModels);
				if (validModels.length > 0 && !selectedModel) {
					setSelectedModel(validModels[0].value);
				}
			})
			.catch(console.error);

		fetch('/api/mcps/servers')
			.then((res) => res.json())
			.then((data) => {
				setMcpServers(data.servers || []);
			})
			.catch(console.error);
	}, []);

	const updateSession = useCallback((sessionId: string, updater: (s: ChatSession) => ChatSession) => {
		setSessions((prev) => prev.map((s) => (s.id === sessionId ? updater(s) : s)));
	}, []);

	const sendMessage = async (
		content: string,
		sessionId: string,
		existingMessages: Message[],
		msgImages?: ImageContent[],
	) => {
		const startTime = Date.now();
		const userMessage: Message = {
			id: `user-${Date.now()}`,
			role: 'user',
			content,
			images: msgImages,
			createdAt: new Date(),
		};

		const assistantMessage: Message = {
			id: `assistant-${Date.now()}`,
			role: 'assistant',
			content: '',
			createdAt: new Date(),
		};

		updateSession(sessionId, (s) => ({
			...s,
			messages: [...existingMessages, userMessage, assistantMessage],
			title: generateTitle([...existingMessages, userMessage]),
			updatedAt: new Date(),
		}));

		setIsLoading(true);
		abortControllerRef.current = new AbortController();

		try {
			// Build messages with image support
			const apiMessages = [...existingMessages, userMessage].map((m) => {
				if (m.images && m.images.length > 0) {
					// Multi-modal message
					return {
						role: m.role,
						content: [
							{ type: 'text', text: m.content },
							...m.images.map((img) => ({
								type: 'image_url',
								image_url: { url: img.base64 || img.url },
							})),
						],
					};
				}
				return { role: m.role, content: m.content };
			});

			// Always use agent endpoint for tool support
			const requestBody: Record<string, unknown> = {
				model: selectedModel,
				messages: apiMessages,
				stream: true,
				temperature: settings.temperature,
				top_p: settings.topP,
				max_tokens: settings.maxTokens,
			};

			if (settings.mcpServers.length > 0) {
				requestBody.mcpServers = settings.mcpServers;
			}

			const response = await fetch('/v1/agent/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
				signal: abortControllerRef.current.signal,
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error?.message || `HTTP ${response.status}`);
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('No response body');

			const decoder = new TextDecoder();
			let buffer = '';
			let fullContent = '';
			let reasoning = '';
			let usage: Message['usage'] | undefined;

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.trim() || !line.startsWith('data: ')) continue;
					const data = line.slice(6);
					if (data === '[DONE]') continue;

					try {
						const parsed = JSON.parse(data);

						// Handle agent streaming format
						if (parsed.type === 'text') {
							fullContent += parsed.content || '';
						} else if (parsed.type === 'usage') {
							usage = {
								promptTokens: parsed.usage?.promptTokens,
								completionTokens: parsed.usage?.completionTokens,
								totalTokens: parsed.usage?.totalTokens,
							};
						} else if (parsed.type === 'step') {
							// Handle step with reasoning
							if (parsed.text) fullContent = parsed.text;
						}

						// Handle OpenAI format
						const delta = parsed.choices?.[0]?.delta;
						if (delta?.content) {
							fullContent += delta.content;
						}
						if (delta?.reasoning_content) {
							reasoning += delta.reasoning_content;
						}
						if (parsed.usage) {
							usage = {
								promptTokens: parsed.usage.prompt_tokens,
								completionTokens: parsed.usage.completion_tokens,
								totalTokens: parsed.usage.total_tokens,
							};
						}

						updateSession(sessionId, (s) => ({
							...s,
							messages: s.messages.map((m) =>
								m.id === assistantMessage.id
									? {
											...m,
											content: fullContent,
											reasoning: reasoning || undefined,
											usage,
											durationMs: Date.now() - startTime,
										}
									: m,
							),
						}));
					} catch {
						// Skip invalid JSON
					}
				}
			}

			updateSession(sessionId, (s) => ({
				...s,
				messages: s.messages.map((m) =>
					m.id === assistantMessage.id ? { ...m, durationMs: Date.now() - startTime } : m,
				),
			}));
		} catch (err) {
			if ((err as Error).name === 'AbortError') return;
			const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
			updateSession(sessionId, (s) => ({
				...s,
				messages: s.messages.map((m) => (m.id === assistantMessage.id ? { ...m, content: '', error: errorMsg } : m)),
			}));
		} finally {
			setIsLoading(false);
			abortControllerRef.current = null;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || !selectedModel || isLoading) return;

		// Add to history
		setInputHistory((prev) => [input.trim(), ...prev.slice(0, 49)]);
		setHistoryIndex(-1);

		let sessionId = currentSessionId;
		let existingMessages = messages;

		if (!sessionId) {
			const newSession: ChatSession = {
				id: generateSessionId(),
				title: 'New Chat',
				model: selectedModel,
				messages: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			setSessions((prev) => [newSession, ...prev]);
			setCurrentSessionId(newSession.id);
			sessionId = newSession.id;
			existingMessages = [];
		}

		const content = input.trim();
		const msgImages = images.length > 0 ? [...images] : undefined;
		setInput('');
		setImages([]);
		await sendMessage(content, sessionId, existingMessages, msgImages);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'ArrowUp' && !input && inputHistory.length > 0) {
			e.preventDefault();
			const newIndex = Math.min(historyIndex + 1, inputHistory.length - 1);
			setHistoryIndex(newIndex);
			setInput(inputHistory[newIndex]);
		} else if (e.key === 'ArrowDown' && historyIndex >= 0) {
			e.preventDefault();
			const newIndex = historyIndex - 1;
			setHistoryIndex(newIndex);
			setInput(newIndex >= 0 ? inputHistory[newIndex] : '');
		}
	};

	const handleRetry = async (messageId: string) => {
		if (!currentSessionId || isLoading) return;
		const msgIndex = messages.findIndex((m) => m.id === messageId);
		if (msgIndex === -1) return;
		const message = messages[msgIndex];
		if (message.role !== 'assistant') return;
		const userMsgIndex = msgIndex - 1;
		if (userMsgIndex < 0) return;
		const userMessage = messages[userMsgIndex];
		if (userMessage.role !== 'user') return;
		const existingMessages = messages.slice(0, userMsgIndex);
		updateSession(currentSessionId, (s) => ({ ...s, messages: existingMessages }));
		await sendMessage(userMessage.content, currentSessionId, existingMessages, userMessage.images);
	};

	const handleEditMessage = (messageId: string) => {
		const message = messages.find((m) => m.id === messageId);
		if (!message || message.role !== 'user') return;
		setEditingMessageId(messageId);
		setEditContent(message.content);
	};

	const handleSaveEdit = async () => {
		if (!editingMessageId || !currentSessionId || !editContent.trim() || isLoading) return;
		const msgIndex = messages.findIndex((m) => m.id === editingMessageId);
		if (msgIndex === -1) return;
		const existingMessages = messages.slice(0, msgIndex);
		setEditingMessageId(null);
		setEditContent('');
		updateSession(currentSessionId, (s) => ({ ...s, messages: existingMessages }));
		await sendMessage(editContent.trim(), currentSessionId, existingMessages);
	};

	const handleCancelEdit = () => {
		setEditingMessageId(null);
		setEditContent('');
	};

	const handleStop = () => {
		abortControllerRef.current?.abort();
	};

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;
		for (const file of files) {
			const reader = new FileReader();
			reader.onload = (ev) => {
				const base64 = ev.target?.result as string;
				setImages((prev) => [...prev, { type: 'image', url: file.name, base64 }]);
			};
			reader.readAsDataURL(file);
		}
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	const removeImage = (index: number) => {
		setImages((prev) => prev.filter((_, i) => i !== index));
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const createSession = useCallback(() => {
		const newSession: ChatSession = {
			id: generateSessionId(),
			title: 'New Chat',
			model: selectedModel,
			messages: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		setSessions((prev) => [newSession, ...prev]);
		setCurrentSessionId(newSession.id);
	}, [selectedModel]);

	const deleteSession = useCallback(
		(sessionId: string) => {
			setSessions((prev) => prev.filter((s) => s.id !== sessionId));
			if (currentSessionId === sessionId) setCurrentSessionId(null);
		},
		[currentSessionId],
	);

	return (
		<div className='flex h-full min-h-[600px]'>
			{/* Sessions Sidebar */}
			{showSidebar && (
				<div className='w-56 border-r border-base-300 bg-base-100 flex flex-col flex-shrink-0'>
					<div className='p-2 border-b border-base-300'>
						<button type='button' className='btn btn-primary btn-sm w-full gap-1' onClick={createSession}>
							<MessageSquarePlus className='w-4 h-4' /> New Chat
						</button>
					</div>
					<div className='flex-1 overflow-y-auto'>
						{sessions.length === 0 ? (
							<div className='p-4 text-center text-base-content/50 text-sm'>No chat history</div>
						) : (
							<ul className='menu p-1 gap-0.5'>
								{sessions.map((session) => (
									<li key={session.id}>
										<button
											type='button'
											className={`flex justify-between items-center w-full text-left py-2 px-2 ${currentSessionId === session.id ? 'active' : ''}`}
											onClick={() => setCurrentSessionId(session.id)}
										>
											<span className='flex-1 truncate text-xs'>{session.title}</span>
											<button
												type='button'
												className='btn btn-ghost btn-xs opacity-50 hover:opacity-100'
												onClick={(e) => {
													e.stopPropagation();
													deleteSession(session.id);
												}}
											>
												<Trash2 className='w-3 h-3' />
											</button>
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			)}

			{/* Main Chat Area */}
			<div className='flex-1 flex flex-col min-w-0'>
				{/* Header */}
				<div className='h-12 px-3 border-b border-base-300 bg-base-100 flex items-center gap-2 flex-shrink-0'>
					<button
						type='button'
						className='btn btn-ghost btn-sm btn-square'
						onClick={() => setShowSidebar(!showSidebar)}
					>
						<Menu className='w-4 h-4' />
					</button>

					{/* Model Selector */}
					<div className='flex-1 max-w-xs'>
						<Combobox.Root
							items={models}
							itemToStringValue={(item: ModelItem) => item.value}
							value={models.find((m) => m.value === selectedModel) || null}
							onValueChange={(item: ModelItem | null) => {
								if (item) setSelectedModel(item.value);
							}}
							onInputValueChange={(value) => {
								if (value) setSelectedModel(value);
							}}
						>
							<Combobox.Input placeholder='Select model...' className='input input-bordered input-sm w-full' />
							<Combobox.Portal>
								<Combobox.Positioner sideOffset={4}>
									<Combobox.Popup className='bg-base-100 rounded-box shadow-lg border border-base-300 max-h-60 overflow-auto z-50'>
										<Combobox.Empty className='p-2 text-sm text-base-content/50'>No models</Combobox.Empty>
										<Combobox.List className='p-1'>
											{(item: ModelItem) => (
												<Combobox.Item
													key={item.id}
													value={item}
													className='p-2 rounded cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200 text-sm'
												>
													{item.value}
												</Combobox.Item>
											)}
										</Combobox.List>
									</Combobox.Popup>
								</Combobox.Positioner>
							</Combobox.Portal>
						</Combobox.Root>
					</div>

					<div className='flex-1' />

					<button
						type='button'
						className={`btn btn-ghost btn-sm btn-square ${showSettings ? 'btn-active' : ''}`}
						onClick={() => setShowSettings(!showSettings)}
					>
						<Settings className='w-4 h-4' />
					</button>
				</div>

				<div className='flex-1 flex overflow-hidden'>
					{/* Messages Area */}
					<div className='flex-1 overflow-y-auto p-4'>
						{messages.length === 0 && (
							<div className='text-center text-base-content/50 py-8'>
								<p>Start a conversation by sending a message.</p>
								{selectedModel && <p className='text-sm mt-2 opacity-70'>Model: {selectedModel}</p>}
							</div>
						)}

						<div className='space-y-6 max-w-3xl mx-auto'>
							{messages.map((message) => (
								<div key={message.id}>
									{message.role === 'user' ? (
										// User message
										<div className='flex justify-end'>
											<div className='max-w-[80%]'>
												{editingMessageId === message.id ? (
													<div className='bg-base-200 rounded-lg p-3'>
														<textarea
															className='textarea textarea-bordered w-full min-w-64'
															value={editContent}
															onChange={(e) => setEditContent(e.target.value)}
															rows={3}
														/>
														<div className='flex gap-2 mt-2'>
															<button type='button' className='btn btn-primary btn-xs' onClick={handleSaveEdit}>
																Save & Send
															</button>
															<button type='button' className='btn btn-ghost btn-xs' onClick={handleCancelEdit}>
																Cancel
															</button>
														</div>
													</div>
												) : (
													<>
														<div className='bg-primary text-primary-content rounded-2xl rounded-br-md px-4 py-2'>
															{message.images && message.images.length > 0 && (
																<div className='flex flex-wrap gap-2 mb-2'>
																	{message.images.map((img, i) => (
																		<img
																			key={i}
																			src={img.base64 || img.url}
																			alt='uploaded'
																			className='max-h-32 rounded'
																		/>
																	))}
																</div>
															)}
															<p className='whitespace-pre-wrap'>{message.content}</p>
														</div>
														<div className='flex justify-end gap-1 mt-1'>
															<button
																type='button'
																className='btn btn-ghost btn-xs opacity-50 hover:opacity-100'
																onClick={() => handleEditMessage(message.id)}
															>
																<Edit2 className='w-3 h-3' />
															</button>
														</div>
													</>
												)}
											</div>
										</div>
									) : (
										// Assistant message - flat display
										<div>
											{message.error ? (
												<div className='text-error flex items-center gap-2'>
													<XCircle className='w-4 h-4' />
													<span>Error: {message.error}</span>
													<button
														type='button'
														className='btn btn-ghost btn-xs'
														onClick={() => handleRetry(message.id)}
													>
														<RefreshCw className='w-3 h-3' />
													</button>
												</div>
											) : (
												<>
													{message.reasoning && (
														<ReasoningDisplay content={message.reasoning} isStreaming={isLoading} />
													)}

													{message.toolCalls?.map((tc) => (
														<ToolCallDisplay key={tc.id} toolCall={tc} />
													))}

													<div className='prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0'>
														<MarkdownContent>{message.content || (isLoading ? '...' : '')}</MarkdownContent>
													</div>

													{/* Actions and metadata */}
													<div className='flex items-center gap-3 mt-2 text-xs text-base-content/50'>
														{message.usage && (
															<span className='flex items-center gap-1'>
																<Zap className='w-3 h-3' />
																{message.usage.totalTokens} tokens
																{message.usage.promptTokens != null && (
																	<span className='opacity-70'>
																		({message.usage.promptTokens}/{message.usage.completionTokens})
																	</span>
																)}
															</span>
														)}
														{message.durationMs && (
															<span className='flex items-center gap-1'>
																<Clock className='w-3 h-3' />
																{(message.durationMs / 1000).toFixed(1)}s
															</span>
														)}
														{message.usage?.completionTokens && message.durationMs && (
															<span>
																{Math.round((message.usage.completionTokens / message.durationMs) * 1000)} tok/s
															</span>
														)}
														<button
															type='button'
															className='btn btn-ghost btn-xs opacity-50 hover:opacity-100'
															onClick={() => copyToClipboard(message.content)}
														>
															<Copy className='w-3 h-3' />
														</button>
														<button
															type='button'
															className='btn btn-ghost btn-xs opacity-50 hover:opacity-100'
															onClick={() => handleRetry(message.id)}
														>
															<RefreshCw className='w-3 h-3' />
														</button>
													</div>
												</>
											)}
										</div>
									)}
								</div>
							))}
						</div>

						<div ref={messagesEndRef} />
					</div>

					{/* Settings Panel */}
					{showSettings && (
						<div className='w-64 border-l border-base-300 bg-base-100 p-4 overflow-y-auto flex-shrink-0'>
							<h3 className='font-semibold mb-4'>Settings</h3>

							<div className='space-y-4'>
								<div>
									<label className='text-xs font-medium'>Temperature: {settings.temperature}</label>
									<input
										type='range'
										min='0'
										max='2'
										step='0.1'
										value={settings.temperature}
										onChange={(e) => setSettings((s) => ({ ...s, temperature: parseFloat(e.target.value) }))}
										className='range range-xs range-primary w-full'
									/>
								</div>

								<div>
									<label className='text-xs font-medium'>Top P: {settings.topP}</label>
									<input
										type='range'
										min='0'
										max='1'
										step='0.05'
										value={settings.topP}
										onChange={(e) => setSettings((s) => ({ ...s, topP: parseFloat(e.target.value) }))}
										className='range range-xs range-primary w-full'
									/>
								</div>

								<div>
									<label className='text-xs font-medium'>Top K: {settings.topK}</label>
									<input
										type='range'
										min='1'
										max='100'
										step='1'
										value={settings.topK}
										onChange={(e) => setSettings((s) => ({ ...s, topK: parseInt(e.target.value, 10) }))}
										className='range range-xs range-primary w-full'
									/>
								</div>

								<div>
									<label className='text-xs font-medium'>Max Tokens: {settings.maxTokens}</label>
									<input
										type='range'
										min='256'
										max='16384'
										step='256'
										value={settings.maxTokens}
										onChange={(e) => setSettings((s) => ({ ...s, maxTokens: parseInt(e.target.value, 10) }))}
										className='range range-xs range-primary w-full'
									/>
								</div>

								<div className='divider text-xs'>MCP Servers</div>

								{mcpServers.length === 0 ? (
									<p className='text-xs text-base-content/50'>No servers configured</p>
								) : (
									<div className='space-y-2'>
										{mcpServers.map((server) => (
											<label key={server.name} className='flex items-center gap-2 cursor-pointer'>
												<input
													type='checkbox'
													className='checkbox checkbox-xs checkbox-primary'
													checked={settings.mcpServers.includes(server.name)}
													onChange={(e) => {
														setSettings((s) => ({
															...s,
															mcpServers: e.target.checked
																? [...s.mcpServers, server.name]
																: s.mcpServers.filter((n) => n !== server.name),
														}));
													}}
												/>
												<span className='text-xs'>{server.name}</span>
												<span className='text-xs text-base-content/50'>({server.type})</span>
											</label>
										))}
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Input Area */}
				<div className='p-3 border-t border-base-300 bg-base-100 flex-shrink-0'>
					{/* Image Previews */}
					{images.length > 0 && (
						<div className='flex flex-wrap gap-2 mb-2'>
							{images.map((img, i) => (
								<div key={i} className='relative'>
									<img src={img.base64 || img.url} alt='preview' className='h-16 rounded' />
									<button
										type='button'
										className='btn btn-circle btn-xs absolute -top-1 -right-1 btn-error'
										onClick={() => removeImage(i)}
									>
										<X className='w-3 h-3' />
									</button>
								</div>
							))}
						</div>
					)}

					<form onSubmit={handleSubmit} className='flex gap-2'>
						<input
							type='file'
							ref={fileInputRef}
							accept='image/*'
							multiple
							className='hidden'
							onChange={handleImageUpload}
						/>
						<button
							type='button'
							className='btn btn-ghost btn-sm btn-square'
							onClick={() => fileInputRef.current?.click()}
						>
							<ImagePlus className='w-4 h-4' />
						</button>
						<input
							ref={inputRef}
							type='text'
							className='input input-bordered flex-1 input-sm'
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={selectedModel ? 'Type a message... (Up arrow for history)' : 'Select a model first'}
							disabled={!selectedModel || isLoading}
						/>
						{isLoading ? (
							<button type='button' className='btn btn-error btn-sm' onClick={handleStop}>
								<Square className='w-4 h-4' />
							</button>
						) : (
							<button type='submit' className='btn btn-primary btn-sm' disabled={!input.trim() || !selectedModel}>
								<Send className='w-4 h-4' />
							</button>
						)}
					</form>
				</div>
			</div>
		</div>
	);
}
