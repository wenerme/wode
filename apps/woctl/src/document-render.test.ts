import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it, vi } from 'vitest';
import { createCli } from './createCli';

function output() {
	const stdout: string[] = [];
	return { stdout, io: { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text) } };
}

describe('native document render port', () => {
	it('detects documents and delegates options without reading binary files as text', async () => {
		const renderDocument = vi.fn(async () => '# Document\n');
		const readText = vi.fn(async () => { throw new Error('Binary files must not use the text port'); });
		const writeText = vi.fn(async () => undefined);
		const cli = createCli({ config: createMemoryCliConfigStore({}), renderDocument, readText, writeText });
		const pdf = output();
		await cli.executeLine('render sample.PDF --pages 1,3 --page-limit 2 --format md', pdf.io);
		expect(renderDocument).toHaveBeenLastCalledWith('sample.PDF', expect.objectContaining({
			input: 'pdf', pages: '1,3', pageLimit: 2, format: 'md', signal: pdf.io.signal,
		}));
		expect(pdf.stdout.join('')).toBe('# Document\n');
		await cli.executeLine('render sample.xlsx --sheet Data --range A1:D20 --limit 5 --offset 2 --no-header -o result.md', output().io);
		expect(renderDocument).toHaveBeenLastCalledWith('sample.xlsx', expect.objectContaining({
			input: 'xlsx', sheet: 'Data', range: 'A1:D20', limit: 5, offset: 2, header: false, color: false,
		}));
		expect(writeText).toHaveBeenCalledWith('result.md', '# Document\n', expect.any(Object));
		await cli.executeLine('render sample.xlsx --limit 0', output().io);
		expect(renderDocument).toHaveBeenLastCalledWith('sample.xlsx', expect.objectContaining({ limit: 0 }));
		expect(readText).not.toHaveBeenCalled();
	});

	it('validates options and help before resolving passwords or opening documents', async () => {
		const renderDocument = vi.fn(async () => '');
		const getEnv = vi.fn(() => 'fixture-password');
		const cli = createCli({ config: createMemoryCliConfigStore({}), renderDocument, getEnv });
		await cli.executeLine('render --help', output().io);
		await expect(cli.executeLine('render sample.pdf --password-env PDF_PASSWORD --page-limit 0', output().io)).rejects.toThrow('Invalid --page-limit');
		await expect(cli.executeLine('render sample.pdf --password-env PDF_PASSWORD --password explicit', output().io)).rejects.toThrow('Choose --password or --password-env');
		expect(renderDocument).not.toHaveBeenCalled();
		expect(getEnv).not.toHaveBeenCalled();
		await cli.executeLine('render sample.pdf --password-env PDF_PASSWORD', output().io);
		expect(renderDocument).toHaveBeenLastCalledWith('sample.pdf', expect.objectContaining({ password: 'fixture-password' }));
	});

	it('reports unsupported document rendering on hosts without a native reader', async () => {
		const cli = createCli({ config: createMemoryCliConfigStore({}) });
		await expect(cli.executeLine('render sample.pdf', output().io)).rejects.toThrow('Host does not support PDF or spreadsheet rendering');
	});
});
