import { type ServiceCliDefinition, serviceCliString } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { IS3Service } from '../IS3Service';
import { sanitizeS3Output } from '../sanitize';

export const S3CliDefinition: ServiceCliDefinition<IS3Service> = {
	name: 's3',
	aliases: ['s3mini'],
	description: 'List, read, write and delete objects in an S3-compatible bucket',
	options: [],
	commands: [
		{
			name: 'list',
			description: 'List objects in the bucket',
			options: [
				{ name: 'delimiter', description: 'Delimiter used to group keys (default: /)' },
				{ name: 'prefix', description: 'Key prefix filter' },
				{ name: 'max-keys', description: 'Maximum number of keys to return' },
			],
			prepare(context) {
				const delimiter = serviceCliString(context.options, 'delimiter');
				const prefix = serviceCliString(context.options, 'prefix');
				const maxKeysRaw = serviceCliString(context.options, 'max-keys');
				let maxKeys: number | undefined;
				if (maxKeysRaw !== undefined) {
					maxKeys = Number(maxKeysRaw);
					if (!Number.isSafeInteger(maxKeys) || maxKeys < 1) throw new ServiceCliInputError('--max-keys must be a positive integer');
				}
				const input = {
					...(delimiter !== undefined ? { delimiter } : {}),
					...(prefix !== undefined ? { prefix } : {}),
					...(maxKeys !== undefined ? { maxKeys } : {}),
				};
				return async (service, callOptions) => sanitizeS3Output(await service.listObject(input, callOptions));
			},
		},
		{
			name: 'get',
			argument: 'key',
			description: 'Read an object as text',
			prepare(context) {
				const key = context.args[0];
				if (!key) throw new ServiceCliInputError('S3 object key is required');
				return async (service, callOptions) => sanitizeS3Output(await service.getObject({ key }, callOptions));
			},
		},
		{
			name: 'put',
			argument: 'key',
			description: 'Write an object; requires --yes and a writable service',
			options: [
				{ name: 'content', description: 'Object content, @file or - for stdin' },
				{ name: 'content-type', description: 'Object content type' },
				{ name: 'yes', description: 'Confirm writing the object', type: 'boolean' },
			],
			async prepare(context) {
				const key = context.args[0];
				if (!key) throw new ServiceCliInputError('S3 object key is required');
				const contentArgument = serviceCliString(context.options, 'content');
				if (contentArgument === undefined) throw new ServiceCliInputError('--content is required');
				if (context.options.yes !== true) throw new ServiceCliInputError('S3 put requires --yes');
				const content = await context.readText(contentArgument, { label: 'S3 object content', maxBytes: 16 * 1024 * 1024 });
				const contentType = serviceCliString(context.options, 'content-type');
				const input = { key, content, ...(contentType !== undefined ? { contentType } : {}) };
				return async (service, callOptions) => sanitizeS3Output(await service.putObject(input, callOptions));
			},
		},
		{
			name: 'delete',
			argument: 'key',
			description: 'Delete an object; requires --yes and a writable service',
			options: [{ name: 'yes', description: 'Confirm deleting the object', type: 'boolean' }],
			prepare(context) {
				const key = context.args[0];
				if (!key) throw new ServiceCliInputError('S3 object key is required');
				if (context.options.yes !== true) throw new ServiceCliInputError('S3 delete requires --yes');
				return async (service, callOptions) => sanitizeS3Output(await service.deleteObject({ key }, callOptions));
			},
		},
	],
};
