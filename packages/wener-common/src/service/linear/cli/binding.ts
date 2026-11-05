import { defineServiceCliBinding } from '../../cli/ServiceCliBinding';
import { LinearServiceProvider } from '../../providers/linear';
import { createLinearServiceToolClient } from '../client';
import { LinearCliDefinition } from './commands';

export const LinearServiceCliBinding = defineServiceCliBinding({
	provider: LinearServiceProvider,
	definition: LinearCliDefinition,
	createClient: createLinearServiceToolClient,
});
