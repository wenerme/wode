import { Terminal } from '@xterm/xterm';
import { expect, it } from 'vitest';
import { moveTerminalCursor, renderTerminalInput } from '../../src/terminal/line-editing';

it('restores the real xterm cursor for its active Unicode provider', async () => {
	const terminal = new Terminal({ cols: 80, rows: 5 });
	const write = (text: string) => new Promise<void>((done) => terminal.write(text, done));
	try {
		for (const grapheme of ['🌏', '👨‍👩‍👧‍👦', 'e\u0301', '中', '🇨🇳']) {
			const input = `A${grapheme}Z`;
			const boundary = 1 + grapheme.length;
			await write(`\r\x1b[2KA${grapheme}`);
			const actualPrefixWidth = terminal.buffer.active.cursorX;
			await write(renderTerminalInput(input, boundary));
			expect(terminal.buffer.active.cursorX).toBe(actualPrefixWidth);
			const left = moveTerminalCursor(input, boundary, -1);
			await write(renderTerminalInput(input, left));
			expect(terminal.buffer.active.cursorX).toBe(1);
			await write(renderTerminalInput(input, moveTerminalCursor(input, left, 1)));
			expect(terminal.buffer.active.cursorX).toBe(actualPrefixWidth);
			expect(terminal.buffer.active.getLine(terminal.buffer.active.cursorY)?.translateToString(true)).toBe(input);
		}
	} finally {
		terminal.dispose();
	}
});
