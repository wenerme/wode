import { oc } from '@orpc/contract';
import { z } from 'zod/v4';
import { AlpineContract } from '../alpine';

export const WenerServerContract = {
	version: oc.output(
		z.object({
			version: z.string(),
		}),
	),
	alpine: AlpineContract,
};
