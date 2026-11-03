import { createMemoryCliConfigStore } from 'common/context';
import { Bash } from 'just-bash/browser';
import { describe, expect, it } from 'vitest';
import { createWocliShellCommand } from './shell';

function shell() {
	return new Bash({
		cwd: '/workspace',
		files: { '/workspace/input.json': '{"text":"文件输入"}' },
		customCommands: [
			createWocliShellCommand({
				config: createMemoryCliConfigStore({ services: [{ name: 'system', type: 'system' }] }),
			}),
		],
	});
}
describe('woctl Bash command', () => {
	it('participates in real Bash pipelines and virtual file redirects', async () => {
		const bash = shell();
		const result = await bash.exec('woctl system echo "00012" --json | cat > output.json && cat output.json');
		expect(result.exitCode).toBe(0);
		expect(JSON.parse(result.stdout)).toEqual({ text: '00012' });
		expect(JSON.parse(await bash.fs.readFile('/workspace/output.json'))).toEqual({ text: '00012' });
	});
	it('reads virtual files and decodes piped UTF-8 stdin', async () => {
		const bash = shell();
		const file = await bash.exec('woctl service call system echo --input @input.json --json');
		expect(file.exitCode).toBe(0);
		expect(JSON.parse(file.stdout)).toEqual({ text: '文件输入' });
		const piped = await bash.exec(`printf '%s' '{"text":"你好 🌏"}' | woctl service call system echo --input - --json`);
		expect(piped.exitCode).toBe(0);
		expect(JSON.parse(piped.stdout)).toEqual({ text: '你好 🌏' });
	});
	it('keeps context state for a session and isolates independent shells', async () => {
		const bash = shell();
		await bash.exec('woctl context create test && woctl context use test');
		expect(JSON.parse((await bash.exec('woctl context show --json')).stdout).name).toBe('test');
		expect(JSON.parse((await shell().exec('woctl context show --json')).stdout).name).toBe('local');
		const invalid = await bash.exec('woctl missing-command');
		expect(invalid.exitCode).toBe(2);
		expect(invalid.stderr).toContain('Unknown command');
	});
	it('renders piped data into virtual files and uses prompt presets offline', async () => {
		const bash = shell();
		const result = await bash.exec(
			`printf '%s' '{"n":1}' | woctl render - --input json --format yaml -o output.yaml && cat output.yaml`,
		);
		expect(result.exitCode).toBe(0);
		expect(result.stdout).toBe('n: 1\n');
		expect((await bash.exec(`woctl prompt import greet --text 'Hello {{name}}'`)).exitCode).toBe(0);
		const preset = await bash.exec('woctl prompt render greet --var name=shell');
		expect(preset.exitCode).toBe(0);
		expect(preset.stdout).toBe('Hello shell\n');
		const prefixed = await bash.exec('woctl p --input name=shell render greet');
		expect(prefixed.exitCode).toBe(0);
		expect(prefixed.stdout).toBe('Hello shell\n');
	});
	it('updates visible commands after context changes in the same shell', async () => {
		const bash = new Bash({
			customCommands: [
				createWocliShellCommand({
					config: createMemoryCliConfigStore({
						currentContext: 'empty',
						contexts: {
							empty: { services: [] },
							active: { services: [{ name: 'system', type: 'system' }] },
						},
					}),
				}),
			],
		});
		expect((await bash.exec('woctl --help')).stdout).not.toMatch(/^\s+system\s/mu);
		expect((await bash.exec('woctl system info')).exitCode).toBe(2);
		expect((await bash.exec('woctl context use active')).exitCode).toBe(0);
		expect((await bash.exec('woctl --help')).stdout).toMatch(/^\s+system\s/mu);
		const active = await bash.exec('woctl system echo selected --json');
		expect(active.exitCode).toBe(0);
		expect(JSON.parse(active.stdout)).toEqual({ text: 'selected' });
		expect((await bash.exec('woctl system info --context empty')).exitCode).toBe(2);
		expect((await bash.exec('woctl system echo still-active --json')).exitCode).toBe(0);
	});
});
