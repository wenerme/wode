/** 常见 Readline/Emacs 输入序列；远端程序可采用不同的键位含义。 */
export const TerminalInputSequences = Object.freeze({
	acceptLine: '\r',
	complete: '\t',
	backwardChar: '\x02',
	forwardChar: '\x06',
	beginningOfLine: '\x01',
	endOfLine: '\x05',
	backwardDeleteChar: '\x7f',
	deleteChar: '\x1b[3~',
	backwardKillLine: '\x15',
	killLine: '\x0b',
	backwardWord: '\x1bb',
	forwardWord: '\x1bf',
	backwardKillWord: '\x1b\x7f',
	killWord: '\x1bd',
	unixWordRubout: '\x17',
	previousHistory: '\x10',
	nextHistory: '\x0e',
	interrupt: '\x03',
	clearScreen: '\x0c',
} as const);
export type TerminalInputCommand = keyof typeof TerminalInputSequences;
export type TerminalCommand =
	| { type: 'key'; name: TerminalInputCommand }
	| { type: 'input'; data: string }
	| { type: 'focus' }
	| { type: 'scrollToBottom' };
export interface TerminalCommandTarget {
	input(data: string): void;
	focus(): void;
	scrollToBottom(): void;
}
export function executeTerminalCommands(
	target: TerminalCommandTarget,
	commands: TerminalCommand | readonly TerminalCommand[],
): void {
	const actions: readonly TerminalCommand[] = Array.isArray(commands) ? commands : [commands as TerminalCommand];
	for (const action of actions) {
		switch (action.type) {
			case 'key':
				target.input(TerminalInputSequences[action.name]);
				break;
			case 'input':
				target.input(action.data);
				break;
			case 'focus':
				target.focus();
				break;
			case 'scrollToBottom':
				target.scrollToBottom();
				break;
		}
	}
}
