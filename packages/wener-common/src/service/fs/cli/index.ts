import { type ServiceCliDefinition, type ServiceCliOptions, serviceCliString } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import {
	FS_MAX_CONTENT_BYTES, FS_MAX_CONTENT_CHARS, FS_MAX_LIST_ENTRIES, type FsServiceInputs,
} from '../FsServiceContract';
import type { IFsService } from '../IFsService';

type Command = ServiceCliDefinition<IFsService>['commands'][number];

function requirePath(args: readonly string[], index = 0, label = 'Path') {
	const value = args[index];
	if (!value) throw new ServiceCliInputError(`${label} is required`);
	return value;
}

function encoding(options: ServiceCliOptions): 'utf8' | 'base64' | undefined {
	const value = serviceCliString(options, 'encoding');
	if (value === undefined) return undefined;
	if (value !== 'utf8' && value !== 'base64') throw new ServiceCliInputError('--encoding must be utf8 or base64');
	return value;
}

function integer(options: ServiceCliOptions, name: string, max: number): number | undefined {
	const raw = serviceCliString(options, name);
	if (raw === undefined) return undefined;
	const value = Number(raw);
	if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new ServiceCliInputError(`--${name} must be an integer between 1 and ${max}`);
	return value;
}

function confirm(options: ServiceCliOptions, command: string) {
	if (options.yes !== true) throw new ServiceCliInputError(`fs ${command} requires --yes`);
}

const flag = (name: string, description: string) => ({ name, description, type: 'boolean' as const });
const yes = (description: string) => flag('yes', description);
const overwrite = flag('overwrite', 'Replace an existing destination');

function transfer(name: 'mv' | 'cp'): Command {
	return {
		name,
		aliases: [name === 'mv' ? 'move' : 'copy'],
		mutating: true,
		arguments: '<from> <to>',
		description: `${name === 'mv' ? 'Move' : 'Copy'} a file or directory; requires --yes and a writable service`,
		options: [overwrite, yes(`Confirm the ${name === 'mv' ? 'move' : 'copy'}`)],
		prepare(context) {
			const from = requirePath(context.args, 0, 'Source path');
			const to = requirePath(context.args, 1, 'Destination path');
			confirm(context.options, name);
			const input: FsServiceInputs['mv'] = { from, to, overwrite: context.options.overwrite === true };
			return (service, callOptions) => service[name](input, callOptions);
		},
	};
}

export const FsCliDefinition: ServiceCliDefinition<IFsService> = {
	name: 'fs',
	aliases: ['file'],
	description: 'List, read, write, move, copy and remove files on local, S3 or WebDAV storage',
	options: [],
	commands: [
		{
			name: 'list',
			aliases: ['ls'],
			arguments: '[path]',
			description: 'List a directory',
			options: [
				flag('recursive', 'List recursively'),
				{ name: 'depth', description: 'Directory depth to list (default 1)' },
				{ name: 'glob', description: 'Filter by POSIX glob on the full path' },
				{ name: 'kind', description: 'file or directory' },
				flag('hidden', 'Include dot files'),
				{ name: 'max-entries', description: 'Maximum entries (default 1000)' },
			],
			prepare(context) {
				const path = context.args[0];
				const kind = serviceCliString(context.options, 'kind');
				if (kind !== undefined && kind !== 'file' && kind !== 'directory') throw new ServiceCliInputError('--kind must be file or directory');
				const glob = serviceCliString(context.options, 'glob');
				const depth = integer(context.options, 'depth', 64);
				const maxEntries = integer(context.options, 'max-entries', FS_MAX_LIST_ENTRIES);
				const input: FsServiceInputs['list'] = {
					...(path ? { path } : {}),
					...(context.options.recursive === true ? { recursive: true } : {}),
					...(context.options.hidden === true ? { hidden: true } : {}),
					...(depth ? { depth } : {}),
					...(glob ? { glob } : {}),
					...(kind ? { kind } : {}),
					...(maxEntries ? { maxEntries } : {}),
				};
				return (service, callOptions) => service.list(input, callOptions);
			},
		},
		{
			name: 'stat',
			argument: 'path',
			description: 'Show metadata for a path',
			prepare(context) {
				const path = requirePath(context.args);
				return (service, callOptions) => service.stat({ path }, callOptions);
			},
		},
		{
			name: 'read',
			aliases: ['cat'],
			argument: 'path',
			description: 'Read a file as UTF-8 text or Base64',
			options: [
				{ name: 'encoding', description: 'utf8 (default) or base64' },
				{ name: 'max-bytes', description: 'Maximum bytes to read (default 1048576)' },
			],
			prepare(context) {
				const path = requirePath(context.args);
				const enc = encoding(context.options);
				const maxBytes = integer(context.options, 'max-bytes', FS_MAX_CONTENT_BYTES);
				const input: FsServiceInputs['read'] = { path, ...(enc ? { encoding: enc } : {}), ...(maxBytes ? { maxBytes } : {}) };
				return (service, callOptions) => service.read(input, callOptions);
			},
		},
		{
			name: 'write',
			mutating: true,
			argument: 'path',
			description: 'Write a file; requires --yes and a writable service',
			options: [
				{ name: 'content', description: 'Content, @file or - for stdin' },
				{ name: 'encoding', description: 'Content encoding: utf8 (default) or base64' },
				overwrite,
				yes('Confirm writing the file'),
			],
			async prepare(context) {
				const path = requirePath(context.args);
				const contentArgument = serviceCliString(context.options, 'content');
				if (contentArgument === undefined) throw new ServiceCliInputError('--content is required');
				const enc = encoding(context.options);
				confirm(context.options, 'write');
				const content = await context.readText(contentArgument, {
					label: 'File content',
					maxBytes: enc === 'base64' ? FS_MAX_CONTENT_CHARS : FS_MAX_CONTENT_BYTES,
				});
				const input: FsServiceInputs['write'] = {
					path,
					content: enc === 'base64' ? content.trim() : content,
					overwrite: context.options.overwrite === true,
					...(enc ? { encoding: enc } : {}),
				};
				return (service, callOptions) => service.write(input, callOptions);
			},
		},
		{
			name: 'mkdir',
			mutating: true,
			argument: 'path',
			description: 'Create a directory; requires --yes and a writable service',
			options: [flag('recursive', 'Create parent directories'), yes('Confirm creating the directory')],
			prepare(context) {
				const path = requirePath(context.args);
				confirm(context.options, 'mkdir');
				const input: FsServiceInputs['mkdir'] = { path, recursive: context.options.recursive === true };
				return (service, callOptions) => service.mkdir(input, callOptions);
			},
		},
		{
			name: 'rm',
			aliases: ['remove'],
			mutating: true,
			argument: 'path',
			description: 'Remove a file or directory; requires --yes and a writable service',
			options: [
				flag('recursive', 'Remove a non-empty directory'),
				flag('force', 'Ignore a missing path'),
				yes('Confirm removing the path'),
			],
			prepare(context) {
				const path = requirePath(context.args);
				confirm(context.options, 'rm');
				const input: FsServiceInputs['rm'] = {
					path, recursive: context.options.recursive === true, force: context.options.force === true,
				};
				return (service, callOptions) => service.rm(input, callOptions);
			},
		},
		transfer('mv'),
		transfer('cp'),
	],
};
