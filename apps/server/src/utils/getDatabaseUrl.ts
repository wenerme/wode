import process from 'node:process';

export function getDatabaseUrl(name = '') {
	name = name?.toUpperCase();
	let keys = ['DATABASE_URL', 'DB_URL', 'DATABASE_DSN', 'DB_DSN'];
	const env = process.env;
	for (let v of keys) {
		const k = name ? `${name}_${v}` : v;
		if (env[k]) {
			return env[k];
		}
	}
}
