import { expect, it } from 'vitest';
import { Cli } from './Cli';

it('describes effective global flags including help as isolated static metadata', () => {
	const cli = new Cli('fixture', { options: [{ name: 'context', aliases: ['c'], description: 'Select context' }] });
	const options = cli.describeOptions();
	expect(options.map((option) => option.name)).toEqual(['help', 'context']);
	expect(options[0]).toMatchObject({ aliases: ['h'], type: 'boolean' });
	expect(Reflect.set(options[1], 'name', 'changed')).toBe(false);
	expect(Reflect.set(options[1].aliases!, 0, 'changed')).toBe(false);
	expect(cli.describeOptions()[1]).toMatchObject({ name: 'context', aliases: ['c'] });
});
