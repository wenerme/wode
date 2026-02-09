import { createServer } from '#/server/server';

const { app } = createServer({});

export default {
	fetch: app.fetch,
};
