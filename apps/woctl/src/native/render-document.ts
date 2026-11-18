import { renderCliOutput } from '@wener/common/cli';
import { renderTuiText } from 'common/tui';
import type { DocumentRenderOptions } from '../commands/render';

/** Native document readers stay outside the browser command graph. */
export async function renderNativeDocument(source: string, options: DocumentRenderOptions): Promise<string> {
	options.signal.throwIfAborted();
	const format = options.format ?? 'terminal';
	let markdown: string;
	if (options.input === 'pdf') {
		const { readPdfText } = await import('common/pdf');
		const result = await readPdfText(source, {
			pages: options.pages, pageLimit: options.pageLimit, password: options.password,
		});
		options.signal.throwIfAborted();
		if (format === 'text') return result.text;
		if (['json', 'jsonl', 'yaml', 'yml'].includes(format))
			return renderCliOutput(result, { format: format as 'json' | 'jsonl' | 'yaml' | 'yml' });
		if (format === 'csv' || format === 'table')
			return renderCliOutput(result.pages.items.map((page) => ({ page: page.number, text: page.text })), { format });
		markdown = result.markdown;
	} else {
		const { readXlsxWorkbook, renderXlsxWorkbookResult } = await import('common/xlsx');
		const result = await readXlsxWorkbook(source, {
			sheet: options.sheet, range: options.range, limit: options.limit, offset: options.offset, raw: options.raw,
		});
		options.signal.throwIfAborted();
		const rendered = renderXlsxWorkbookResult(result, ['terminal', 'text'].includes(format) ? 'md' : format, {
			detectHeader: options.header, rawRows: options.header === false,
		});
		if (!['terminal', 'text'].includes(format)) return rendered;
		markdown = rendered;
	}
	return renderTuiText(markdown, {
		input: 'markdown', format: ['md', 'markdown'].includes(format) ? 'md' : format === 'text' ? 'text' : 'terminal',
		source, width: options.width, color: options.color, link: options.link,
	});
}
