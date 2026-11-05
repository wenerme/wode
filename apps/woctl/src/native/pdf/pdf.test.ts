import { link, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Cli } from '@wener/common/cli';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMultiPagePdf, createTextPdf } from '../../../../../packages/common/src/pdf/document.fixture';
import type { CliExecution } from '../../createCli';
import { createPdfCommand } from './index';

const dirs: string[] = [];
async function fixture(content = createTextPdf(['Hello PDF'])) {
	const dir = await mkdtemp(path.join(os.tmpdir(), 'woctl-pdf-'));
	dirs.push(dir);
	const file = path.join(dir, 'sample.pdf');
	await writeFile(file, content);
	return { dir, file };
}
function setup() {
	const stdout = vi.fn();
	const getEnv = vi.fn(() => undefined as string | undefined);
	const writeText = vi.fn(async (file: string, text: string) => {
		await writeFile(file, text);
	});
	const binary: Uint8Array[] = [];
	const stdoutStream = new WritableStream<Uint8Array>({
		write(chunk) {
			binary.push(chunk);
		},
	});
	const context = {
		signal: new AbortController().signal,
		stdout,
		stdoutStream,
		host: { getEnv, writeText, term: { stdoutIsTTY: false } },
	} as unknown as CliExecution;
	const cli = new Cli<CliExecution>('woctl');
	cli.add(createPdfCommand());
	return {
		stdout,
		getEnv,
		writeText,
		binary,
		context,
		run: (args: string[]) => cli.execute(['pdf', ...args], context),
	};
}
afterEach(async () => {
	await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('native pdf command', () => {
	it('exposes all five commands and keeps help free of file and secret access', async () => {
		const command = createPdfCommand();
		expect(command.commands?.map((item) => item.name)).toEqual(['info', 'inspect', 'read', 'parse', 'render']);
		const app = setup();
		app.getEnv.mockImplementation(() => {
			throw new Error('must not access env during help');
		});
		for (const name of ['info', 'inspect', 'read', 'parse', 'render']) {
			await app.run([name, '/missing/example.pdf', '--password-env', 'EXAMPLE_PDF_PASSWORD', '--help']);
			expect(app.stdout.mock.lastCall?.[0]).toContain(`pdf ${name}`);
		}
		expect(app.getEnv).not.toHaveBeenCalled();
	});
	it('lists all original templates without reading file/password env', async () => {
		const app = setup();
		await app.run(['parse', '--list-templates', '--json', '--password-env', 'EXAMPLE_PDF_PASSWORD']);
		expect(JSON.parse(app.stdout.mock.lastCall![0]).map((item: { name: string }) => item.name)).toEqual([
			'invoice.zh.vat',
			'invoice.generic',
			'receipt.generic',
			'bank.statement.generic',
		]);
		expect(app.getEnv).not.toHaveBeenCalled();
	});
	it('runs info, inspect and read through generic CLI with inherited output flags', async () => {
		const { file } = await fixture();
		const app = setup();
		await app.run(['info', file, '--output', 'json']);
		expect(JSON.parse(app.stdout.mock.lastCall![0]).document.pages).toBe(1);
		await app.run(['inspect', file, '--debug', '--text', '--text-limit', '5', '--output', 'json']);
		const result = JSON.parse(app.stdout.mock.lastCall![0]);
		expect(result.options.detail).toBe('debug');
		expect(result.pages.items[0].text).toMatchObject({ sample: 'Hello', truncated: true });
		await app.run(['read', file, '--no-page-headings', '--frontmatter']);
		expect(app.stdout.mock.lastCall![0]).toContain('Hello PDF');
		expect(app.stdout.mock.lastCall![0]).not.toContain('## Page');
		await app.run(['read', file, '--text', '--password-env', 'EXAMPLE_PDF_PASSWORD']);
		expect(app.stdout.mock.lastCall![0]).toBe('Hello PDF');
		expect(app.getEnv).toHaveBeenCalledExactlyOnceWith('EXAMPLE_PDF_PASSWORD');
	});
	it('parses a generated invoice with source flags and confidence validation', async () => {
		const { file } = await fixture(
			createTextPdf(['INVOICE', 'Invoice No: INV-1', 'Date: 2026-01-01', 'Bill To: Example Buyer', 'Total: USD 10.00']),
		);
		const app = setup();
		await app.run(['parse', file, '--template', 'invoice', '--debug', '--min-confidence', '0.5', '--json']);
		expect(JSON.parse(app.stdout.mock.lastCall![0]).result.data).toMatchObject({
			invoiceNumber: 'INV-1',
			totalAmount: 10,
		});
		await expect(app.run(['parse', file, '--min-confidence', '2'])).rejects.toThrow('min-confidence');
		await expect(app.run(['parse'])).rejects.toThrow('Missing PDF file');
	});
	it('rejects invalid flags before reading PDFs or environment values', async () => {
		const app = setup();
		for (const args of [
			['read', '--line-gap', '0'],
			['inspect', '--max-depth', '0'],
			['inspect', '--detail', 'unknown'],
			['info', '--page-limit', '0'],
			['render', '--page', '1', '--pages', 'all'],
			['render', '--width', '-1'],
			['read', '--verbosity', 'unknown'],
		]) {
			await expect(
				app.run([args[0]!, '/missing/example.pdf', ...args.slice(1), '--password-env', 'EXAMPLE_PDF_PASSWORD']),
			).rejects.toThrow();
		}
		expect(app.getEnv).not.toHaveBeenCalled();
	});
	it('writes selected text output and requires explicit in-place authorization for source aliases', async () => {
		const { file, dir } = await fixture();
		const original = await readFile(file);
		const app = setup();
		const output = path.join(dir, 'read.md');
		await app.run(['read', file, '--output-file', output]);
		expect(await readFile(output, 'utf8')).toContain('Hello PDF');
		const symbolic = path.join(dir, 'source-link.pdf');
		const hard = path.join(dir, 'source-hard.pdf');
		await symlink(file, symbolic);
		await link(file, hard);
		for (const destination of [file, symbolic, hard])
			await expect(app.run(['read', file, '--output-file', destination])).rejects.toThrow('--in-place');
		expect(await readFile(file)).toEqual(original);
		await app.run(['read', file, '--text', '--output-file', file, '--in-place']);
		expect(await readFile(file, 'utf8')).toBe('Hello PDF');
	});
	it('writes binary PNG to stdout without any text contamination', async () => {
		const { file } = await fixture();
		const app = setup();
		await app.run(['render', file, '--width', '24', '--dpi', '72']);
		expect(Buffer.from(app.binary[0]!).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
		expect(app.stdout).not.toHaveBeenCalled();
	});
	it('renders multiple pages to explicit patterns and rejects invalid paths without writing', async () => {
		const { file, dir } = await fixture(createMultiPagePdf());
		const app = setup();
		const pattern = path.join(dir, 'pages', 'page-%03d-{index}.png');
		await app.run(['render', file, '--pages', 'last,first', '--width', '24', '--output', pattern]);
		for (const name of ['page-003-1.png', 'page-001-2.png'])
			expect((await readFile(path.join(dir, 'pages', name))).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
		await expect(app.run(['render', file, '--pages', 'all', '-o', path.join(dir, 'invalid.png')])).rejects.toThrow(
			'output pattern',
		);
		await expect(readFile(path.join(dir, 'invalid.png'))).rejects.toMatchObject({ code: 'ENOENT' });
		await expect(app.run(['render', file, '--pages', 'all'])).rejects.toThrow('Multiple PNGs');
		await expect(app.run(['render', file, '--output', file])).rejects.toThrow('--in-place');
	});
	it('requires an explicit PNG output on a terminal', async () => {
		const app = setup();
		app.context.host.term = { stdoutIsTTY: true };
		await expect(app.run(['render', '/missing/example.pdf'])).rejects.toThrow('--output');
		expect(app.getEnv).not.toHaveBeenCalled();
	});
});
