export function joinUrl(...args: string[]) {
	return args.join('/').replaceAll(/(?<!:)\/{2,}/g, '/');
}
