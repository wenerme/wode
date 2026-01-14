import { describe, expect, test } from 'vitest';
import { getAnsiStyle, type AnsiFormatOptions } from './getAnsiStyle';

describe('getAnsiStyle', () => {
	const style = getAnsiStyle(true);
	const noStyle = getAnsiStyle(false);

	describe('basic colors', () => {
		test('red', () => {
			expect(style.red('error')).toBe('\x1b[31merror\x1b[0m');
		});

		test('green', () => {
			expect(style.green('success')).toBe('\x1b[32msuccess\x1b[0m');
		});

		test('blue', () => {
			expect(style.blue('info')).toBe('\x1b[34minfo\x1b[0m');
		});

		test('yellow', () => {
			expect(style.yellow('warn')).toBe('\x1b[33mwarn\x1b[0m');
		});

		test('gray', () => {
			expect(style.gray('dim')).toBe('\x1b[90mdim\x1b[0m');
		});
	});

	describe('modifiers', () => {
		test('bold', () => {
			expect(style.bold('strong')).toBe('\x1b[1mstrong\x1b[0m');
		});

		test('italic', () => {
			expect(style.italic('emphasis')).toBe('\x1b[3memphasis\x1b[0m');
		});

		test('underline', () => {
			expect(style.underline('link')).toBe('\x1b[4mlink\x1b[0m');
		});

		test('dim', () => {
			expect(style.dim('faded')).toBe('\x1b[2mfaded\x1b[0m');
		});

		test('strikethrough', () => {
			expect(style.strikethrough('deleted')).toBe('\x1b[9mdeleted\x1b[0m');
		});
	});

	describe('background colors', () => {
		test('bgRed', () => {
			expect(style.bgRed('alert')).toBe('\x1b[41malert\x1b[0m');
		});

		test('bgGreen', () => {
			expect(style.bgGreen('success')).toBe('\x1b[42msuccess\x1b[0m');
		});

		test('bgBlue', () => {
			expect(style.bgBlue('info')).toBe('\x1b[44minfo\x1b[0m');
		});
	});

	describe('chaining', () => {
		test('red.bold', () => {
			expect(style.red.bold('error')).toBe('\x1b[31;1merror\x1b[0m');
		});

		test('bold.red (order matters for output)', () => {
			expect(style.bold.red('error')).toBe('\x1b[1;31merror\x1b[0m');
		});

		test('red.bold.italic', () => {
			expect(style.red.bold.italic('text')).toBe('\x1b[31;1;3mtext\x1b[0m');
		});

		test('bgRed.white.bold', () => {
			expect(style.bgRed.white.bold('alert')).toBe('\x1b[41;37;1malert\x1b[0m');
		});

		test('blue.underline.italic', () => {
			expect(style.blue.underline.italic('link')).toBe('\x1b[34;4;3mlink\x1b[0m');
		});

		test('long chain', () => {
			const result = style.bgBlue.white.bold.underline.italic('styled');
			expect(result).toBe('\x1b[44;37;1;4;3mstyled\x1b[0m');
		});
	});

	describe('format method', () => {
		test('format with fg color', () => {
			expect(style.format('text', { fg: 'red' })).toBe('\x1b[31mtext\x1b[0m');
		});

		test('format with bg color', () => {
			expect(style.format('text', { bg: 'blue' })).toBe('\x1b[44mtext\x1b[0m');
		});

		test('format with fg and bg', () => {
			expect(style.format('text', { fg: 'white', bg: 'red' })).toBe('\x1b[37;41mtext\x1b[0m');
		});

		test('format with modifiers', () => {
			expect(style.format('text', { bold: true, italic: true })).toBe('\x1b[1;3mtext\x1b[0m');
		});

		test('format with all options', () => {
			const options: AnsiFormatOptions = {
				fg: 'white',
				bg: 'red',
				bold: true,
				italic: true,
				underline: true,
			};
			expect(style.format('alert', options)).toBe('\x1b[37;41;1;3;4malert\x1b[0m');
		});

		test('chain + format combines styles', () => {
			expect(style.red.format('text', { bold: true })).toBe('\x1b[31;1mtext\x1b[0m');
		});

		test('format with empty options returns chained styles', () => {
			expect(style.red.bold.format('text')).toBe('\x1b[31;1mtext\x1b[0m');
		});
	});

	describe('disabled mode', () => {
		test('returns plain text when disabled', () => {
			expect(noStyle.red('error')).toBe('error');
		});

		test('chaining returns plain text when disabled', () => {
			expect(noStyle.red.bold.italic('text')).toBe('text');
		});

		test('format returns plain text when disabled', () => {
			expect(noStyle.format('text', { fg: 'red', bold: true })).toBe('text');
		});

		test('chain + format returns plain text when disabled', () => {
			expect(noStyle.red.format('text', { underline: true })).toBe('text');
		});
	});

	describe('lazy initialization', () => {
		test('getAnsiStyle returns same instance for same enabled state', () => {
			const a = getAnsiStyle(true);
			const b = getAnsiStyle(true);
			expect(a).toBe(b);
		});

		test('getAnsiStyle returns different instances for different enabled states', () => {
			const enabled = getAnsiStyle(true);
			const disabled = getAnsiStyle(false);
			expect(enabled).not.toBe(disabled);
		});
	});

	describe('edge cases', () => {
		test('empty string', () => {
			expect(style.red('')).toBe('\x1b[31m\x1b[0m');
		});

		test('string with special characters', () => {
			expect(style.red('hello\nworld')).toBe('\x1b[31mhello\nworld\x1b[0m');
		});

		test('format with unknown color is ignored', () => {
			expect(style.format('text', { fg: 'unknown' as string })).toBe('text');
		});

		test('format with no options returns plain text', () => {
			expect(style.format('text', {})).toBe('text');
		});

		test('accessing non-existent property returns undefined', () => {
			expect((style as any).nonExistent).toBeUndefined();
		});
	});
});
