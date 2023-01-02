/* eslint-disable @typescript-eslint/no-redeclare */
import { z } from 'zod';

export const SizeType = z.enum(['lg', 'md', 'sm', 'xs'] as const);
export type SizeType = z.infer<typeof SizeType>;
export const IntentType = z.enum(['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'] as const);
export type IntentType = z.infer<typeof IntentType>;
