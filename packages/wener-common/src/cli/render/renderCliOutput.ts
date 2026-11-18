import { CliUsageError } from '../CliCommand';
import { formatCliOutput } from '../format/formatCliOutput';
import { CliFormatError, type CliFormatOptions } from '../format/types';
import type { CliTable } from './CliTable';

export type RenderCliOutputOptions = CliFormatOptions & { table?: CliTable; columns?: number };

export function renderCliOutput(value: unknown, options: RenderCliOutputOptions = {}): string {
	const { columns, table, ...formatOptions } = options;
	try {
		return formatCliOutput(value, { ...formatOptions, table, w: formatOptions.w ?? columns });
	} catch (error) {
		if (error instanceof CliFormatError) throw new CliUsageError(error.message);
		throw error;
	}
}
