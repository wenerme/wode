export function getDatabaseUrl(name = '', env = globalThis.process?.env || {}): string | undefined {
	name = name?.toUpperCase();
	let keys = ['DATABASE_URL', 'DB_URL', 'DATABASE_DSN', 'DB_DSN'];
	for (let v of keys) {
		const k = name ? `${name}_${v}` : v;
		if (env[k]) {
			return env[k];
		}
	}
	return undefined;
}
