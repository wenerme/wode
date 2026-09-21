import { describe, it } from 'vitest';
import { createSchemaData, toJsonSchema } from '../../schema';
import { renderJsonSchemaToMarkdownDoc } from '../../tools/renderJsonSchemaToMarkdownDoc';
import { AnyResourceSchema } from './AnyResourceSchema';

describe('schema', () => {
	it('should be convert to jsonschema', () => {
		console.log(renderJsonSchemaToMarkdownDoc(toJsonSchema(AnyResourceSchema)));
	});

	it('should create from schema', () => {
		console.log(
			createSchemaData(AnyResourceSchema, {
				all: true,
			}),
		);
	});
});
