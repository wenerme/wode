import process from 'node:process';
import { defineConfig, loadEnv } from 'vite-plus';

export default ({ mode }: { mode: string }) => {
	const env = loadEnv(mode, process.cwd(), '');
	process.env = Object.assign(process.env, env);
	return defineConfig({ test: { alias: { '@/': new URL('./src/', import.meta.url).pathname } } });
};
