import { forEachJsonSchema, type JsonSchemaDef } from '../jsonschema';
import { toJsonSchema, type TypeSchema } from '../schema';

export const RedactedText = '[redacted]';

export function buildRedactorFormSchema(
	ts: TypeSchema,
	{
		shouldRedact = (schema) => schema['x-sensitive'] === true,
		replacer = () => RedactedText,
	}: {
		shouldRedact?: (schema: JsonSchemaDef) => boolean;
		replacer?: (key: string, value: any) => any;
	},
) {
	let js = toJsonSchema(ts);

	let paths: string[][] = [];

	forEachJsonSchema(js, (js, { path }) => {
		if (shouldRedact(js)) {
			paths.push(path);
		}
	});
	const vis = (root: any, path: string[]) => {
		switch (root) {
			case null:
			case undefined:
				return;
		}

		let c = root;
		for (let i = 0; i < path.length; i++) {
			let k = path[i];
			if (c && typeof c === 'object' && k in c) {
				let v = c[k];
				if (path.length === 1) {
					c[k] = replacer(k, v);
				} else if (Array.isArray(v)) {
					for (let vv of v) {
						vis(vv, path.slice(i + 1));
					}
				} else {
					vis(v, path.slice(i + 1));
				}
			}
		}
	};

	return (root: any) => {
		if (!paths.length) {
			return root;
		}

		paths.forEach((path) => {
			vis(root, path);
		});

		return root;
	};
}

function buildReversibleRedactText({
	id,
	type,
	key,
	timestamp,
}: {
	id?: string | number;
	type?: string;
	key?: string;
	timestamp?: number | boolean;
} = {}) {
	if (!id) {
		return RedactedText;
	}
	if (timestamp === true) {
		timestamp = Date.now();
	}
	return `[redacted ${id}]`;
}

export function isRedactedText(v: any) {
	return v === RedactedText || (typeof v === 'string' && v.startsWith('[redacted ') && v.endsWith(']'));
}
