import { types } from 'mime-types';
import pathe from 'pathe';

export function findMimeType(path: string | undefined | null) {
	// fix extname error
	// https://github.com/jshttp/mime-types/issues/111

	if (!path || typeof path !== 'string') {
		return false;
	}

	// get the extension ("ext" or ".ext" or full path)
	var extension = pathe
		.extname('x.' + path)
		.toLowerCase()
		.slice(1);

	if (!extension) {
		return false;
	}

	return types[extension] || false;
}
