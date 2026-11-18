import { defineServiceCliBinding } from '../../cli';
import { FeishuServiceProvider } from '../index';
import { createFeishuServiceToolClient } from './client';
import { FeishuCliDefinition } from './commands';

export const FeishuServiceCliBinding = defineServiceCliBinding({
	provider: FeishuServiceProvider,
	definition: FeishuCliDefinition,
	createClient: createFeishuServiceToolClient,
});
