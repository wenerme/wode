import { describe, expect, it } from 'vitest';
import { deleteTerminalBackward, moveTerminalCursor, normalizeTerminalCursor } from '../../src/terminal/line-editing';

describe('Unicode terminal editing', () => {
	for (const grapheme of ['🌏', '👨‍👩‍👧‍👦', 'e\u0301', '中', '🇨🇳']) {
		it(`moves and deletes ${grapheme} as one grapheme`, () => {
			const input = `A${grapheme}Z`;
			const end = 1 + grapheme.length;
			expect(moveTerminalCursor(input, end, -1)).toBe(1);
			expect(moveTerminalCursor(input, 1, 1)).toBe(end);
			const deleted = deleteTerminalBackward(input, end);
			expect(deleted).toEqual({ input: 'AZ', cursor: 1 });
			expect(deleted.input.isWellFormed()).toBe(true);
		});
	}
	it('snaps inside a surrogate pair to the next boundary and handles both ends', () => {
		expect(normalizeTerminalCursor('🌏', 1)).toBe(2);
		expect(deleteTerminalBackward('echo 🌏', 'echo 🌏'.length)).toEqual({ input: 'echo ', cursor: 5 });
		expect(deleteTerminalBackward('', 0)).toEqual({ input: '', cursor: 0 });
		expect(moveTerminalCursor('a', 0, -1)).toBe(0);
		expect(moveTerminalCursor('a', 1, 1)).toBe(1);
	});
});
