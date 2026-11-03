import * as client from '@wener/client/ai/message-generation';
import { prepareMessageGenerationExchange as clientExchange } from '@wener/client/ai/message-generation/request';
import { readSse as clientReadSse } from '@wener/client/ai/message-generation/sse';
import { expect, it } from 'vitest';
import { executePrompt } from './execute';
import * as compatibility from './index';
import { preparePromptExchange } from './request';
import { readSse } from './sse';

it('preserves public prompt module and deep import function identities', () => {
	expect(compatibility.executePrompt).toBe(client.generateMessage);
	expect(executePrompt).toBe(client.generateMessage);
	expect(compatibility.preparePromptRequest).toBe(client.prepareMessageGenerationRequest);
	expect(compatibility.redactPromptRequest).toBe(client.redactMessageGenerationRequest);
	expect(preparePromptExchange).toBe(clientExchange);
	expect(readSse).toBe(clientReadSse);
});
