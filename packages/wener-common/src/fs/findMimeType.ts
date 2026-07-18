import { GeneratedMimeTypes } from './mimeTypes.generated';

export function findMimeType(path: string | undefined | null): string | false {
	if (!path || typeof path !== 'string') return false;
	const cleanPath = path.split(/[?#]/, 1)[0].replaceAll('\\', '/');
	const basename = cleanPath.slice(cleanPath.lastIndexOf('/') + 1);
	const extension = basename.includes('.') ? basename.slice(basename.lastIndexOf('.') + 1) : basename;
	const normalizedExtension = extension.toLowerCase();
	return Object.hasOwn(GeneratedMimeTypes, normalizedExtension)
		? GeneratedMimeTypes[normalizedExtension as keyof typeof GeneratedMimeTypes]
		: false;
}
