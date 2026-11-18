export interface CodeRenderOptions {
	language?: string;
	color?: boolean;
}

const LanguageByExtension = new Map<string, string>([
	['js', 'javascript'],
	['mjs', 'javascript'],
	['cjs', 'javascript'],
	['jsx', 'jsx'],
	['ts', 'typescript'],
	['mts', 'typescript'],
	['cts', 'typescript'],
	['tsx', 'tsx'],
	['json', 'json'],
	['jsonc', 'json'],
	['jsonl', 'json'],
	['yaml', 'yaml'],
	['yml', 'yaml'],
	['css', 'css'],
	['scss', 'scss'],
	['sass', 'scss'],
	['html', 'xml'],
	['htm', 'xml'],
	['xml', 'xml'],
	['svg', 'xml'],
	['sql', 'sql'],
	['sh', 'bash'],
	['bash', 'bash'],
	['zsh', 'bash'],
	['fish', 'bash'],
	['py', 'python'],
	['go', 'go'],
	['rs', 'rust'],
	['java', 'java'],
	['kt', 'kotlin'],
	['kts', 'kotlin'],
	['swift', 'swift'],
	['php', 'php'],
	['rb', 'ruby'],
	['toml', 'toml'],
	['ini', 'ini'],
	['conf', 'ini'],
	['env', 'ini'],
	['proto', 'protobuf'],
	['md', 'markdown'],
	['markdown', 'markdown'],
]);
const LanguageByBasename = new Map<string, string>([
	['dockerfile', 'dockerfile'],
	['containerfile', 'dockerfile'],
	['makefile', 'makefile'],
	['justfile', 'makefile'],
	['package.json', 'json'],
	['tsconfig.json', 'json'],
	['pnpm-lock.yaml', 'yaml'],
]);

export function languageForSource(source = ''): string | undefined {
	const base = source.split(/[\\/]/u).at(-1)?.toLowerCase() ?? '';
	const known = LanguageByBasename.get(base);
	if (known) return known;
	const extension = base.includes('.') ? (base.split('.').at(-1) ?? '') : '';
	return LanguageByExtension.get(extension);
}

export function isKnownCodeSource(source = ''): boolean {
	const language = languageForSource(source);
	return Boolean(language && language !== 'markdown' && language !== 'json' && language !== 'yaml');
}

export function prettyJsonText(text: string): string {
	const trimmed = text.trim();
	if (!trimmed) return '';
	try {
		return `${JSON.stringify(JSON.parse(trimmed), null, 2)}\n`;
	} catch {
		return text.endsWith('\n') ? text : `${text}\n`;
	}
}

export function prettyJsonLinesText(text: string): string {
	const rendered = text.split(/\r?\n/u).map((line) => {
		if (!line.trim()) return line;
		try {
			return JSON.stringify(JSON.parse(line), null, 2);
		} catch {
			return line;
		}
	});
	return `${rendered.join('\n').replace(/\s+$/u, '')}\n`;
}
