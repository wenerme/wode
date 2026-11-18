import { defineServiceCliBinding } from '../../cli/ServiceCliBinding';
import { LinearServiceProvider } from '../LinearServiceProvider';
import { createLinearServiceToolClient } from '../client';
import { LinearCliDefinition } from './commands';

export const LinearServiceCliBinding = defineServiceCliBinding({
	provider: LinearServiceProvider,
	definition: LinearCliDefinition,
	createClient: createLinearServiceToolClient,
});
