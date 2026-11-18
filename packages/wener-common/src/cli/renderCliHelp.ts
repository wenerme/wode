import type { CliCommandDefinition, CliOption } from './CliCommand';
import { renderCliTable } from './render/renderCliTable';
import { renderCliOverview } from './renderCliOverview';

export function renderCliHelp(
	name: string,
	commands: readonly CliCommandDefinition[],
	path: readonly CliCommandDefinition[],
	options: readonly CliOption[],
	columns?: number,
	helpFooter?: string,
): string {
	const command = path.at(-1);
	const visibleOptions = options.filter((option) => !path.length || option.helpScope !== 'root');
	const label = path.map(commandLabel).join(' ');
	const overviewCommands = command ? (command.commands ?? []) : commands;
	const usage = [
		name,
		label,
		command?.usage ?? command?.arguments ?? (overviewCommands.length ? '<command>' : ''),
		'[options]',
	]
		.filter(Boolean)
		.join(' ');
	const sections = [`Usage: ${usage}`];
	if (command) sections.push(command.description);
	if (overviewCommands.length) {
		sections.push(renderCliOverview(overviewCommands, { columns }).trimEnd());
		sections.push(`Run '${[name, ...path.map((entry) => entry.name), '<command>', '--help'].join(' ')}' for details.`);
	}
	sections.push(
		`Options:\n${renderCliTable(
			{
				headers: [],
				rows: visibleOptions.map((option) => [
					[
						...(option.aliases ?? []).map((alias) => `${alias.length === 1 ? '-' : '--'}${alias}`),
						`--${option.name}${option.type === 'boolean' ? '' : ' <value>'}`,
						...(option.negatable ? [`--no-${option.name}`] : []),
					].join(', '),
					`${option.description}${option.repeatable ? ' (repeatable)' : ''}${option.default === undefined ? '' : ` (default: ${option.default})`}`,
				]),
			},
			{ columns },
		).trimEnd()}`,
	);
	if (!path.length && helpFooter) sections.push(helpFooter.trimEnd());
	return `${sections.join('\n\n')}\n`;
}

function commandLabel(command: CliCommandDefinition): string {
	return [command.name, ...(command.aliases ?? [])].join('|');
}
