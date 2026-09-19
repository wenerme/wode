declare module 'better-sqlite3' {
	const Database: new (filename: string, options?: object) => any;

	export default Database;
}
