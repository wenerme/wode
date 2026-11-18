export type CliOutputMode =
	| 'table'
	| 'wide'
	| 'describe'
	| 'desc'
	| 'json'
	| 'jsonl'
	| 'yaml'
	| 'yml'
	| 'csv'
	| 'md'
	| 'markdown'
	| 'name'
	| 'value';

export type CliStyle = (text: string) => string;

export interface CliFormatOptions {
	format?: CliOutputMode;
	fields?: readonly string[];
	w?: number;
	h?: number;
	styles?: Partial<Record<'title' | 'header' | 'label' | 'value' | 'footer' | 'empty', CliStyle>>;
	truncate?: boolean;
	headers?: boolean;
	footer?: boolean;
	compact?: boolean;
}

export class CliFormatError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CliFormatError';
	}
}
