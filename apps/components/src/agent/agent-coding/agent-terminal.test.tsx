import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { AgentTerminal } from './agent-terminal';

const noop = () => undefined;

describe('AgentTerminal', () => {
	it('renders plain structured command output and terminal metadata', () => {
		const markup = renderToStaticMarkup(
			<AgentTerminal
				command=''
				entries={[
					{
						command: 'pnpm test',
						finishedAt: 2,
						id: 'entry-1',
						result: {
							durationMs: 42,
							exitCode: 1,
							settled: true,
							stderr: 'failed\n',
							stdout: 'running\n',
							truncated: true,
						},
						startedAt: 1,
						status: 'failed',
					},
				]}
				onCommandChange={noop}
			/>,
		);
		expect(markup).toContain('<pre');
		expect(markup).toContain('pnpm test');
		expect(markup).toContain('退出码 1');
		expect(markup).toContain('42 ms');
		expect(markup).toContain('输出已截断');
		expect(markup).not.toMatch(/xterm|pty|streaming/iu);
	});

	it('shows cancel for an active command and disables future commands when poisoned', () => {
		const active = renderToStaticMarkup(
			<AgentTerminal
				activeCommand={{ command: 'sleep 10', id: 'active', startedAt: 1 }}
				command=''
				entries={[]}
				onCancel={noop}
				onCommandChange={noop}
			/>,
		);
		expect(active).toContain('取消命令');
		const poisoned = renderToStaticMarkup(
			<AgentTerminal command='echo ok' entries={[]} poisoned onCommandChange={noop} onRun={noop} />,
		);
		expect(poisoned).toContain('执行器已污染');
		expect(poisoned).toContain('disabled=""');
	});
});
