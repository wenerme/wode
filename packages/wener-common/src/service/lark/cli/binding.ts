import { defineServiceCliBinding } from '../../cli';
import { LarkServiceProvider } from '../index';
import { createLarkServiceToolClient } from './client';
import { LarkCliDefinition } from './commands';

export const LarkServiceCliBinding = defineServiceCliBinding({
	provider: LarkServiceProvider,
	definition: LarkCliDefinition,
	createClient: createLarkServiceToolClient,
});
