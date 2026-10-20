import {
	type CliCommand,
	type CliCommandDefinition,
	type CliCommandResult,
	type CliOption,
	type CliOptions,
	CliOutputOptions,
	CliUsageError,
	resolveCliOutput,
} from './CliCommand';
import type { CliIO } from './CliIO';
import { expandCliVariadicOptions } from './expandCliVariadicOptions';
import { parseCliArgs, resolveCliOptions, safeCliToken, validateCliArguments } from './parseCliArgs';
import { renderCliHelp } from './renderCliHelp';

export interface CliContext extends CliIO {
	signal: AbortSignal;
	columns?: number;
}

export interface CliParsedInput {
	/** Canonical command names, with aliases resolved. */
	path: readonly string[];
	args: string[];
	options: CliOptions;
}

const helpOption: CliOption = { name: 'help', aliases: ['h'], type: 'boolean', description: 'Show help' };

export class Cli<C extends CliContext = CliContext> {
	readonly #commands: CliCommand<C>[] = [];
	readonly #globals: readonly CliOption[];
	#sealed = false;
	readonly #helpFooter?: string;

	constructor(
		readonly name: string,
		options: { options?: readonly CliOption[]; helpFooter?: string } = {},
	) {
		this.#globals = [helpOption, ...(options.options ?? CliOutputOptions)];
		this.#helpFooter = options.helpFooter;
	}

	add(command: CliCommand<C>): void {
		if (this.#sealed) throw new Error('CLI command registry is sealed');
		const snapshot = snapshotCommand(command);
		checkSiblings([...this.#commands, snapshot]);
		this.#commands.push(snapshot);
	}

	/** 将宿主适配器合并到已注册的命令树；普通add仍然拒绝重复根命令。 */
	merge(command: CliCommand<C>): void {
		if (this.#sealed) throw new Error('CLI command registry is sealed');
		const snapshot = snapshotCommand(command);
		const index = this.#commands.findIndex(
			(existing) => existing.name === snapshot.name || existing.aliases?.some((alias) => alias === snapshot.name),
		);
		if (index < 0) {
			checkSiblings([...this.#commands, snapshot]);
			this.#commands.push(snapshot);
			return;
		}
		const existing = this.#commands[index];
		if (!existing) throw new Error('CLI command merge target disappeared');
		const merged = mergeCommand(existing, snapshot);
		const next = [...this.#commands];
		next[index] = merged;
		checkSiblings(next);
		this.#commands[index] = merged;
	}

	seal(): void {
		this.#sealed = true;
	}

	describe(): readonly CliCommandDefinition[] {
		return Object.freeze(this.#commands.map(describeCommand));
	}

	/** Parse the selected branch without running handlers or requiring complete positional arguments. */
	parse(argv: readonly string[]): CliParsedInput {
		const raw = this.#resolveRaw(argv);
		if (raw) {
			const parsed = parseCliArgs(raw.prefix, this.#globals);
			return {
				path: [raw.command.name],
				args: [...raw.args],
				options: resolveCliOptions(this.#globals, parsed.options),
			};
		}
		const { path, args, options } = this.#parseCommand(argv);
		return { path: path.map((command) => command.name), args, options };
	}

	#resolveRaw(argv: readonly string[]) {
		const rootIndex = findRootCommandIndex(argv, this.#globals);
		const raw = this.#commands.find(
			(command) => command.name === argv[rootIndex] || command.aliases?.includes(argv[rootIndex]),
		);
		const childIndex = raw
			? findRootCommandIndex(argv, mergeOptions([...this.#globals, ...(raw.options ?? [])]), rootIndex + 1)
			: -1;
		const rawChild = raw?.commands?.find(
			(command) => command.name === argv[childIndex] || command.aliases?.includes(argv[childIndex]),
		);
		const rest = argv.slice(rootIndex + 1);
		const helpOnlyMerged =
			!rawChild &&
			Boolean(raw?.commands?.some((child) => child.raw !== true)) &&
			rest.every((token) => token === '--help' || token === '-h');
		const canRunRaw = !helpOnlyMerged && (!raw?.commands?.length || !rawChild || rawChild.raw !== false);
		if (raw?.runRaw && canRunRaw && (rootIndex === 0 || raw.raw === false)) {
			return {
				command: raw,
				run: raw.runRaw,
				prefix: argv.slice(0, rootIndex),
				args: argv.slice(rootIndex + 1),
				argv: [...argv.slice(0, rootIndex), ...argv.slice(rootIndex + 1)],
			};
		}
		return undefined;
	}

	#parseCommand(argv: readonly string[]) {
		const path: CliCommand<C>[] = [];
		let commands: readonly CliCommand<C>[] = this.#commands;
		let cursor = 0;
		// 先沿 argv 定位命令路径，只用已经匹配的祖先声明跳过选项值。
		// 兄弟分支的同名选项、别名和类型不会参与当前命令的解析。
		while (commands.length && cursor < argv.length) {
			cursor = findRootCommandIndex(
				argv,
				mergeOptions([...this.#globals, ...path.flatMap((entry) => entry.options ?? [])]),
				cursor,
			);
			if (cursor < 0 || cursor >= argv.length) break;
			const name = argv[cursor];
			const command = commands.find((command) => command.name === name || command.aliases?.includes(name));
			if (!command) break;
			path.push(command);
			cursor++;
			commands = command.commands ?? [];
		}
		const command = path.at(-1);
		const definitions = mergeOptions([...this.#globals, ...path.flatMap((entry) => entry.options ?? [])]);
		const parsed = parseCliArgs(
			definitions.some((option) => option.variadic) ? expandCliVariadicOptions(argv, definitions) : argv,
			definitions,
		);
		const args = parsed.args.slice(path.length);
		if ((!command || (command.commands?.length && !(command.run && command.arguments))) && args.length) {
			const name = safeCliToken(args[0] ?? '');
			const scope = path.map((entry) => entry.name).join(' ');
			throw new CliUsageError(
				name
					? `Unknown command: ${[scope, name].filter(Boolean).join(' ')}; run the command with --help`
					: 'Unknown command; run the command with --help',
			);
		}
		const options = resolveCliOptions(definitions, parsed.options);
		return { path, command, definitions, args, options };
	}

	async execute(argv: readonly string[], context: C): Promise<CliCommandResult | undefined> {
		context.signal.throwIfAborted();
		const raw = this.#resolveRaw(argv);
		if (raw) return (await raw.run.call(raw.command, raw.argv, context)) ?? undefined;
		const { path, command, definitions, args, options } = this.#parseCommand(argv);
		const name = this.name;
		const commandsForHelp = this.#commands;
		const helpFooter = this.#helpFooter;
		let help: string | undefined;
		const input = {
			args,
			options,
			get help() {
				return (help ??= renderCliHelp(name, commandsForHelp, path, definitions, context.columns, helpFooter));
			},
		};
		if (options.help || !command || !command.run) {
			context.stdout(input.help);
			return;
		}
		if (command.output !== 'custom') resolveCliOutput(options);
		validateCliArguments(args, command.arguments);
		context.signal.throwIfAborted();
		return (await command.run(input, context)) ?? undefined;
	}
}

function mergeOptions(options: readonly CliOption[]): CliOption[] {
	return [...new Map(options.map((option) => [option.name, option])).values()];
}

function snapshotCommand<C>(command: CliCommand<C>): CliCommand<C> {
	if ([command.name, ...(command.aliases ?? [])].some((name) => !/^[a-z][a-z0-9-]*$/u.test(name)))
		throw new Error('Invalid CLI command name');
	const commands = (command.commands ?? []).map(snapshotCommand);
	checkSiblings(commands);
	return Object.freeze({
		...command,
		aliases: Object.freeze([...(command.aliases ?? [])]),
		summary: command.summary ? Object.freeze([...command.summary]) : undefined,
		options: Object.freeze(
			(command.options ?? []).map((option) =>
				Object.freeze({ ...option, aliases: Object.freeze([...(option.aliases ?? [])]) }),
			),
		),
		commands: Object.freeze(commands),
	});
}

function mergeCommand<C>(base: CliCommand<C>, incoming: CliCommand<C>): CliCommand<C> {
	const children = [...(base.commands ?? [])];
	for (const child of incoming.commands ?? []) {
		const index = children.findIndex(
			(existing) =>
				existing.name === child.name ||
				existing.aliases?.some((alias) => alias === child.name) ||
				child.aliases?.some((alias) => alias === existing.name),
		);
		if (index < 0) children.push(child);
		else {
			const existing = children[index];
			if (!existing) throw new Error('CLI child merge target disappeared');
			children[index] = mergeCommand(existing, child);
		}
	}
	const aliases = [...new Set([...(base.aliases ?? []), ...(incoming.aliases ?? [])])];
	const options = [...(base.options ?? [])];
	for (const option of incoming.options ?? []) {
		const index = options.findIndex((existing) => existing.name === option.name);
		if (index < 0) options.push(option);
		else options[index] = option;
	}
	return Object.freeze({
		...base,
		aliases: Object.freeze(aliases),
		description: base.description || incoming.description,
		hidden: base.hidden ?? incoming.hidden,
		summary: base.summary || incoming.summary,
		arguments: base.arguments ?? incoming.arguments,
		usage: base.usage ?? incoming.usage,
		options: Object.freeze(options),
		commands: children.length ? Object.freeze(children) : undefined,
		raw: base.raw ?? incoming.raw,
		run: base.run ?? incoming.run,
		runRaw: base.runRaw ?? incoming.runRaw,
	});
}

function describeCommand<C>(command: CliCommand<C>): CliCommandDefinition {
	const { name, hidden, output, aliases, description, summary, arguments: args, usage, options, commands } = command;
	return Object.freeze({
		name,
		...(output ? { output } : {}),
		...(hidden ? { hidden } : {}),
		...(command.runRaw || command.raw !== undefined ? { raw: command.raw !== false } : {}),
		aliases,
		description,
		summary,
		arguments: args,
		usage,
		options,
		commands: Object.freeze((commands ?? []).map(describeCommand)),
	});
}

function checkSiblings<C>(commands: readonly CliCommand<C>[]): void {
	const names = new Set<string>();
	for (const command of commands) {
		for (const name of [command.name, ...(command.aliases ?? [])]) {
			if (names.has(name)) throw new Error(`Duplicate CLI command or alias: ${name}`);
			names.add(name);
		}
	}
}

function findRootCommandIndex(argv: readonly string[], globals: readonly CliOption[], start = 0): number {
	let index = start;
	while (index < argv.length && argv[index].startsWith('-')) {
		const token = argv[index];
		if (token === '--') return index + 1;
		const long = token.startsWith('--');
		const names = long ? [token.slice(2).split('=', 1)[0]] : [...token.slice(1).split('=', 1)[0]];
		let consumesValue = false;
		for (let flag = 0; flag < names.length; flag++) {
			const name = names[flag];
			const option = globals.find(
				(option) =>
					option.name === name ||
					option.aliases?.includes(name) ||
					(long && option.type === 'boolean' && name === `no-${option.name}`),
			);
			if (!option) return -1;
			if (option.type === 'boolean') continue;
			consumesValue = !token.includes('=') && (long || flag === names.length - 1);
			break;
		}
		index += consumesValue ? 2 : 1;
	}
	return index;
}
