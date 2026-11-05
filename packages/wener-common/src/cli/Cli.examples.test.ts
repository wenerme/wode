import { expect, it, vi } from 'vitest';
import { Cli } from './Cli';
import type { CliCommandDefinition } from './CliCommand';

it('snapshots examples and preserves them through describe serialization and reconstruction', () => {
	const examples = [{ command: 'test read', description: 'Read a value' }];
	const cli = new Cli('test');
	cli.add({ name: 'read', description: 'Read', examples, run: vi.fn() });
	examples[0]!.command = 'changed';
	expect(cli.describe()[0]?.examples).toEqual([{ command: 'test read', description: 'Read a value' }]);
	expect(Object.isFrozen(cli.describe()[0]?.examples?.[0])).toBe(true);
	const restored = new Cli('test');
	const restoredDefinitions: readonly CliCommandDefinition[] = JSON.parse(JSON.stringify(cli.describe()));
	for (const command of restoredDefinitions) restored.add(command);
	expect(restored.describe()).toEqual(cli.describe());
	expect(JSON.parse(JSON.stringify(restored.describe()))).toEqual(JSON.parse(JSON.stringify(cli.describe())));
});

it('keeps base examples and adopts incoming examples when merging an undescribed command', () => {
	const cli = new Cli('test');
	cli.add({ name: 'read', description: 'Read' });
	cli.merge({ name: 'read', description: 'Read', examples: [{ command: 'test read first' }] });
	cli.merge({ name: 'read', description: 'Read', examples: [{ command: 'test read second' }] });
	expect(cli.describe()[0]?.examples).toEqual([{ command: 'test read first' }]);
});
