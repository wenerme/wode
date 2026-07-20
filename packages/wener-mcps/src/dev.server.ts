import { setupAudit } from '#/audit/server';
import { createServer } from '#/server/server';

const { app, finalize } = createServer({
	setup: (ctx) => {
		setupAudit(ctx);
	},
});

await finalize();

export default {
	fetch: app.fetch,
};
