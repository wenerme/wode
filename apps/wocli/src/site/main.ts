import { createBrowserConfigStore, createWocliWebCli } from '../web';
import './style.css';

function element<T extends HTMLElement>(selector: string): T {
	const value = document.querySelector<T>(selector);
	if (!value) throw new Error(`Missing element: ${selector}`);
	return value;
}
const form = element<HTMLFormElement>('#command-form');
const input = element<HTMLInputElement>('#command');
const run = element<HTMLButtonElement>('#run');
const cancel = element<HTMLButtonElement>('#cancel');
const transcript = element<HTMLDivElement>('#transcript');
let storage: Storage | undefined;
try {
	storage = window.localStorage;
	storage.getItem('wocli.config');
} catch {
	/* 隐私模式下用内存，命令仍可执行。 */
}
const cli = createWocliWebCli({ config: storage ? createBrowserConfigStore(storage) : undefined });
let active: AbortController | undefined;
const history: string[] = [];
let historyIndex = 0;

function append(text: string, className = ''): HTMLPreElement {
	const block = document.createElement('pre');
	block.className = className;
	block.textContent = text;
	transcript.append(block);
	transcript.scrollTop = transcript.scrollHeight;
	return block;
}
async function execute(line: string): Promise<void> {
	if (active || !line.trim()) return;
	append(`❯ ${line}`, 'command-line');
	history.push(line);
	historyIndex = history.length;
	input.value = '';
	const controller = new AbortController();
	active = controller;
	run.disabled = true;
	cancel.hidden = false;
	let streamBlock: HTMLPreElement | undefined;
	try {
		await cli.executeLine(line, {
			signal: controller.signal,
			columns: Math.max(40, Math.floor(transcript.clientWidth / 8)),
			stdout: (text) => append(text),
			stderr: (text) => append(text, 'error'),
			write: (text) => {
				(streamBlock ??= append('')).append(document.createTextNode(text));
				transcript.scrollTop = transcript.scrollHeight;
			},
		});
	} catch (error) {
		append(error instanceof Error ? error.message : '命令执行失败', 'error');
	} finally {
		active = undefined;
		run.disabled = false;
		cancel.hidden = true;
		input.focus();
	}
}
form.addEventListener('submit', (event) => {
	event.preventDefault();
	void execute(input.value);
});
cancel.addEventListener('click', () => active?.abort(new Error('命令已取消')));
element('#clear').addEventListener('click', () => transcript.replaceChildren());
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-command]'))
	button.addEventListener('click', () => {
		void execute(button.dataset.command ?? '');
	});
input.addEventListener('keydown', (event) => {
	if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
	event.preventDefault();
	historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
	input.value = history[historyIndex] ?? '';
});
append(
	'wocli 0.1.0\n输入 --help 查看命令。可运行 service add system --provider system 添加离线服务。使用 ↑ / ↓ 浏览历史。',
	'welcome',
);
void execute('--help');
