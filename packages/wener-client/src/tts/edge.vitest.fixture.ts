import { defineConfig } from 'vitest/config';

// Focused offline checks without the workspace config's dotenv loading.
export default defineConfig({
	test: { include: ['src/tts/edge.test.ts', 'src/tts/node.test.ts'], environment: 'node' },
});
