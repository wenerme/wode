import type { TerminalCommand } from './input';
export type TerminalKeyboardPlatform = 'mac' | 'other';
export interface TerminalKeybinding {
	key: string;
	ctrl?: boolean;
	alt?: boolean;
	shift?: boolean;
	meta?: boolean;
	platform?: TerminalKeyboardPlatform;
	commands: readonly TerminalCommand[] | null;
	repeat?: boolean;
}
export interface TerminalKeyboardOptions {
	platform?: TerminalKeyboardPlatform;
	defaults?: boolean;
	keybindings?: readonly TerminalKeybinding[];
}
export const DefaultTerminalKeybindings: readonly TerminalKeybinding[] = [
	{ platform: 'mac', key: 'Backspace', meta: true, commands: [{ type: 'key', name: 'backwardKillLine' }] },
	{ platform: 'mac', key: 'ArrowLeft', meta: true, commands: [{ type: 'key', name: 'beginningOfLine' }] },
	{ platform: 'mac', key: 'ArrowRight', meta: true, commands: [{ type: 'key', name: 'endOfLine' }] },
	{ platform: 'mac', key: 'ArrowLeft', alt: true, commands: [{ type: 'key', name: 'backwardWord' }] },
	{ platform: 'mac', key: 'ArrowRight', alt: true, commands: [{ type: 'key', name: 'forwardWord' }] },
	{ platform: 'mac', key: 'Backspace', alt: true, commands: [{ type: 'key', name: 'backwardKillWord' }] },
	{ platform: 'mac', key: 'Delete', alt: true, commands: [{ type: 'key', name: 'killWord' }] },
	{ platform: 'other', key: 'Backspace', ctrl: true, commands: [{ type: 'key', name: 'backwardKillWord' }] },
	{ platform: 'other', key: 'Delete', ctrl: true, commands: [{ type: 'key', name: 'killWord' }] },
];
export function resolveTerminalKeybinding(
	event: KeyboardEvent,
	options: TerminalKeyboardOptions,
): TerminalKeybinding | undefined {
	if (event.type !== 'keydown' || event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
	if (event.getModifierState?.('AltGraph')) return;
	const platform =
		options.platform ?? (typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? 'mac' : 'other');
	const matches = (binding: TerminalKeybinding) =>
		(!binding.platform || binding.platform === platform) &&
		binding.key.toLowerCase() === event.key.toLowerCase() &&
		Boolean(binding.ctrl) === event.ctrlKey &&
		Boolean(binding.alt) === event.altKey &&
		Boolean(binding.shift) === event.shiftKey &&
		Boolean(binding.meta) === event.metaKey;
	return (
		options.keybindings?.findLast(matches) ??
		(options.defaults === false ? undefined : DefaultTerminalKeybindings.findLast(matches))
	);
}
