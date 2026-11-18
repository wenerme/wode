import type { PdfInfoResult, PdfPageInfo } from '../info.js';
import type { PdfInspectResult } from '../inspect.js';
import type { PdfParseResult } from '../parser/index.js';

function boolText(value: unknown): string {
	if (value === true) return 'yes';
	if (value === false) return 'no';
	if (value === null) return 'none';
	return value === undefined ? '' : String(value);
}
function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function valueText(value: unknown, max = 180): string {
	if (value === undefined || value === null || value === '') return '';
	if (Array.isArray(value)) return value.filter((item) => item != null).join(', ');
	if (typeof value === 'object') {
		const text = JSON.stringify(value);
		return text.length > max ? `${text.slice(0, max)}…` : text;
	}
	return String(value);
}
function row(label: string, value: unknown): string | undefined {
	const text = valueText(value);
	return text ? `- **${label}:** ${text}` : undefined;
}
function markdownTable(headers: string[], rows: string[][]): string {
	if (!rows.length) return '';
	return [
		`| ${headers.join(' | ')} |`,
		`| ${headers.map(() => '---').join(' | ')} |`,
		...rows.map((items) => `| ${items.join(' | ')} |`),
	].join('\n');
}
function pageSize(page: PdfPageInfo): string {
	return `${Math.round(page.widthPt)} × ${Math.round(page.heightPt)} pt (${page.widthIn} × ${page.heightIn} in)`;
}
function rows(items: Array<string | undefined>): string[] {
	return items.filter((item): item is string => item !== undefined);
}

export function renderPdfInfoMarkdown(info: PdfInfoResult): string {
	const meta = info.metadata;
	const lines = [
		'# PDF Info',
		'',
		'## File',
		...rows([
			row('Name', info.file.name),
			row('Path', info.file.path),
			row('Size', `${info.file.size} (${info.file.sizeBytes} bytes)`),
			row('SHA-256', info.file.sha256),
		]),
		'',
		'## Document',
		...rows([
			row('Pages', info.document.pages),
			row('PDF version', info.document.pdfVersion),
			row('Fingerprints', info.document.fingerprints),
			row('Linearized', boolText(info.document.isLinearized)),
			row('Encrypted / permissions present', boolText(info.document.isEncrypted)),
			row('Pure XFA', boolText(info.document.isPureXfa)),
		]),
		'',
		'## Metadata',
		...rows([
			row('Title', meta.title),
			row('Author', meta.author),
			row('Subject', meta.subject),
			row('Keywords', meta.keywords),
			row('Creator', meta.creator),
			row('Producer', meta.producer),
			row('Created', meta.creationDate),
			row('Modified', meta.modDate),
			row('Language', meta.language),
		]),
	];
	if (!lines.at(-1)?.startsWith('- ')) lines.push('- _(none)_');
	lines.push('', '## Viewer');
	const viewer = rows([
		row('Page layout', info.viewer.pageLayout),
		row('Page mode', info.viewer.pageMode),
		row('Permissions', info.viewer.permissions?.join(', ')),
		row('Mark info', info.viewer.markInfo),
	]);
	lines.push(...(viewer.length ? viewer : ['- _(none)_']));
	lines.push('', `## Pages (${info.pages.sampled}/${info.pages.total}${info.pages.truncated ? ', truncated' : ''})`);
	lines.push(
		markdownTable(
			['#', 'Label', 'Size', 'Orientation', 'Rotation', 'Annotations'],
			info.pages.items.map((page) => [
				String(page.number),
				page.label ?? '',
				pageSize(page),
				page.orientation,
				`${page.rotation}°`,
				page.annotationCount === undefined ? '' : String(page.annotationCount),
			]),
		),
	);
	lines.push('', '## Outline');
	if (info.outline.count)
		lines.push(
			row('Items', info.outline.count) ?? '',
			...info.outline.items.map(
				(item) => `- ${item.title || '(untitled)'}${item.children ? ` (${item.children} children)` : ''}`,
			),
		);
	else lines.push('- _(none)_');
	lines.push('', '## Attachments', info.attachments.count ? `- ${info.attachments.names.join('\n- ')}` : '- _(none)_');
	return lines.join('\n');
}
function renderObjectSection(title: string, value: Record<string, unknown> | undefined, preferred: string[]): string[] {
	if (!value) return [];
	const values = preferred.flatMap((key) => (key in value ? rows([row(key, value[key])]) : []));
	const extra = Object.keys(value).filter((key) => !preferred.includes(key));
	if (extra.length) values.push(row('extra', extra.join(', ')) ?? '');
	return ['', `## ${title}`, ...(values.length ? values : ['- _(none)_'])];
}
function recordCount(value: unknown): string {
	return isRecord(value) && typeof value.count === 'number' ? String(value.count) : '';
}
function renderInspectPageDetails(pages: Record<string, unknown>[]): string[] {
	const details: string[] = [];
	for (const page of pages) {
		const text = isRecord(page.text) ? page.text : undefined;
		const annotations = isRecord(page.annotations) ? page.annotations : undefined;
		const operators = isRecord(page.operators) ? page.operators : undefined;
		if (!text && !annotations && !operators && !page.jsActions && !page.structTree) continue;
		details.push('', `### Page ${valueText(page.number)}`);
		if (text)
			details.push(
				row(
					'Text',
					`${text.items ?? 0} items, ${text.chars ?? 0} chars${text.truncated ? ', truncated sample' : ''}`,
				) ?? '',
				text.sample ? `> ${valueText(text.sample, 500)}` : '',
			);
		if (annotations)
			details.push(row('Annotations', `${annotations.count ?? 0}${annotations.truncated ? ', truncated' : ''}`) ?? '');
		if (operators)
			details.push(row('Operators', `${operators.fnCount ?? 0} functions, ${operators.unique ?? 0} unique`) ?? '');
		if (page.structTree)
			details.push(
				row('Struct tree', isRecord(page.structTree) ? boolText(page.structTree.present) : page.structTree) ?? '',
			);
		if (page.jsActions) details.push(row('JS actions', page.jsActions) ?? '');
	}
	return details;
}
export function renderPdfInspectMarkdown(info: PdfInspectResult): string {
	const pageItems = info.pages?.items ?? [];
	const lines = [
		'# PDF Inspect',
		'',
		'## File',
		row('Name', info.file.name) ?? '',
		row('Path', info.file.path) ?? '',
		row('Size', `${info.file.size} (${info.file.sizeBytes} bytes)`) ?? '',
		row('SHA-256', info.file.sha256) ?? '',
		'',
		'## Document',
		...[
			'pages',
			'pdfVersion',
			'pdfjsVersion',
			'fingerprints',
			'isLinearized',
			'isEncrypted',
			'isPureXfa',
			'hasXfaHtml',
			'downloadLength',
			'dataLengthMatchesFile',
		].flatMap((key) => rows([row(key, info.document[key])])),
		'',
		'## Options',
		...rows(Object.entries(info.options).map(([key, value]) => row(key, value))),
		...renderObjectSection('Metadata', info.metadata, [
			'title',
			'author',
			'subject',
			'keywords',
			'creator',
			'producer',
			'creationDate',
			'modDate',
			'language',
		]),
		...renderObjectSection('Viewer', info.viewer, [
			'pageLayout',
			'pageMode',
			'permissions',
			'markInfo',
			'viewerPreferences',
			'openAction',
		]),
		...renderObjectSection('Catalog / Forms / JS', info.catalog, [
			'hasJSActions',
			'calculationOrderIds',
			'fields',
			'destinations',
			'optionalContent',
			'jsActions',
		]),
	];
	if (info.pages) {
		lines.push('', `## Pages (${info.pages.sampled}/${info.pages.total}${info.pages.truncated ? ', truncated' : ''})`);
		lines.push(
			markdownTable(
				['#', 'Label', 'Size', 'Rotation', 'Ann', 'Text', 'Ops', 'Struct'],
				pageItems.map((page) => [
					valueText(page.number),
					valueText(page.label),
					`${Math.round(Number(page.widthPt ?? 0))} × ${Math.round(Number(page.heightPt ?? 0))} pt`,
					`${valueText(page.rotation)}°`,
					recordCount(page.annotations),
					isRecord(page.text) ? `${page.text.items ?? 0}/${page.text.chars ?? 0}` : '',
					isRecord(page.operators) ? valueText(page.operators.fnCount) : '',
					isRecord(page.structTree) ? boolText(page.structTree.present) : '',
				]),
			),
		);
		lines.push(...renderInspectPageDetails(pageItems));
	}
	if (info.outline)
		lines.push(
			'',
			`## Outline (${info.outline.sampled}/${info.outline.count}${info.outline.truncated ? ', truncated' : ''})`,
			info.outline.items.length
				? markdownTable(
						['Level', 'Title', 'Children', 'URL'],
						info.outline.items.map((item) => [
							valueText(item.level),
							valueText(item.title),
							valueText(item.children),
							valueText(item.url),
						]),
					)
				: '- _(none)_',
		);
	if (info.attachments)
		lines.push(
			'',
			`## Attachments (${info.attachments.count})`,
			info.attachments.items.length
				? markdownTable(
						['Name', 'Filename', 'Size'],
						info.attachments.items.map((item) => [
							valueText(item.name),
							valueText(item.filename),
							valueText(item.sizeBytes),
						]),
					)
				: '- _(none)_',
		);
	if (info.errors.length)
		lines.push(
			'',
			'## Errors',
			...info.errors.map(
				(item) =>
					`- ${item.section}${item.page ? ` page ${item.page}` : ''}: ${item.name ? `${item.name}: ` : ''}${item.message}`,
			),
		);
	if (info.timings)
		lines.push('', '## Timings', ...Object.entries(info.timings).map(([key, value]) => row(key, `${value} ms`) ?? ''));
	return lines.join('\n');
}
export function renderPdfParseMarkdown(result: PdfParseResult): string {
	const candidates = result.candidates.map(
		(item) =>
			`- ${item.name}: ${(item.confidence * 100).toFixed(0)}%${item.reasons.length ? ` (${item.reasons.join(', ')})` : ''}`,
	);
	return [
		'# PDF Parse',
		'',
		`- **Template:** ${result.selectedTemplate.name}`,
		`- **Confidence:** ${(result.selectedTemplate.confidence * 100).toFixed(0)}%`,
		`- **File:** ${result.file.path}`,
		`- **Pages:** ${result.document.pages}`,
		'',
		result.result.markdown,
		result.result.warnings.length
			? ['', '## Warnings', ...result.result.warnings.map((item) => `- ${item}`)].join('\n')
			: '',
		'',
		'## Candidates',
		...(candidates.length ? candidates : ['- _(none)_']),
	]
		.filter(Boolean)
		.join('\n');
}
