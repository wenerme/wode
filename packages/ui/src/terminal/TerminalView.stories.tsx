import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { BrowserShellStory } from './BrowserShellStory';

const meta = {
	title: 'Infrastructure/Shell',
	component: BrowserShellStory,
	render: (args) => <BrowserShellStory key={String(args.withWocli)} {...args} />,
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BrowserShellStory>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Woctl: Story = {
	args: { withWocli: true },
	play: async ({ canvas, userEvent }) => {
		const run = canvas.getByRole('button', { name: '运行 woctl' });
		await waitFor(() => expect(run).toBeEnabled(), { timeout: 20000 });
		await userEvent.click(run);
		await waitFor(() => expect(canvas.getByTestId('shell-last-output')).toHaveTextContent('"runtime": "web"'));
		await waitFor(() => expect(canvas.getByRole('button', { name: '管道' })).toBeEnabled());
		await userEvent.click(canvas.getByRole('button', { name: '管道' }));
		await waitFor(() => expect(canvas.getByTestId('shell-last-output')).toHaveTextContent('"text": "pipeline"'));
		await waitFor(() => expect(canvas.getByRole('button', { name: '读取 JSON 文件' })).toBeEnabled());
		await userEvent.click(canvas.getByRole('button', { name: '读取 JSON 文件' }));
		await waitFor(() => expect(canvas.getByTestId('shell-last-output')).toHaveTextContent('from virtual file'));
		await waitFor(() => expect(canvas.getByRole('button', { name: '聚焦' })).toBeEnabled());
		await userEvent.click(canvas.getByRole('button', { name: '聚焦' }));
		const input = canvas.getByRole('textbox', { name: 'Terminal input' });
		const clipboard = new DataTransfer();
		clipboard.setData('text/plain', 'echo a🌏b');
		input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true, cancelable: true }));
		// xterm 的按键解析需要旧版 keyCode；测试发送与真实按键一致的字段。
		for (const [key, keyCode] of [
			['ArrowLeft', 37],
			['Backspace', 8],
			['Enter', 13],
		] as const) {
			input.dispatchEvent(
				new KeyboardEvent('keydown', { key, code: key, keyCode, which: keyCode, bubbles: true, cancelable: true }),
			);
			input.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, keyCode, which: keyCode, bubbles: true }));
		}
		await waitFor(() => expect(canvas.getByTestId('shell-last-output').textContent).toBe('ab\n'));
	},
};
export const Bash: Story = {
	args: { withWocli: false },
	play: async ({ canvas, userEvent }) => {
		const write = canvas.getByRole('button', { name: '写入并读取文件' });
		await waitFor(() => expect(write).toBeEnabled(), { timeout: 20000 });
		await userEvent.click(write);
		await waitFor(() => expect(canvas.getByTestId('shell-last-output')).toHaveTextContent('hello from shell'));
	},
};
