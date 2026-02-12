import { MetadataStorage, Utils, type Dictionary, type EntityMetadata } from '@mikro-orm/core';

export function patchMikroORMMetadataStorage() {
	if (patchMikroORMMetadataStorage.original) {
		return;
	}

	const MS = MetadataStorage as any;
	if (typeof MS.getMetadataFromDecorator !== 'function') {
		// v7: getMetadataFromDecorator no longer exists, skip patching
		return;
	}

	patchMikroORMMetadataStorage.original = MS.getMetadataFromDecorator;

	{
		let _idMap = new WeakMap();
		let nameMap = new Map<string, number>();
		const PATH_SYMBOL = MS.PATH_SYMBOL;
		MS.getMetadataFromDecorator = <T = any>(
			target: T & Dictionary & { [key: symbol]: string },
		): EntityMetadata<T> => {
			if (PATH_SYMBOL && !Object.hasOwn(target, PATH_SYMBOL)) {
				Object.defineProperty(target, PATH_SYMBOL, {
					value: (Utils as any).lookupPathFromDecorator?.(target.name) ?? target.name,
					writable: true,
				});
			}

			let name = target.name;
			if (name && !name.endsWith('__') && name.endsWith('MixinEntity')) {
				let id = _idMap.get(target);
				if (!id) {
					id = (nameMap.get(target.name) || 0) + 1;
					nameMap.set(target.name, id);
					_idMap.set(target, id);
				}

				name = `${target.name}__${id}__`;
			}
			const path = (Utils as any).lookupPathFromDecorator?.(name) ?? name;
			const meta = MetadataStorage.getMetadata(name, path);

			name !== target.name && Object.defineProperty(target, 'name', { value: name, writable: true });
			return meta;
		};
	}
}

patchMikroORMMetadataStorage.original = null as Function | null;
