import process from 'node:process';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default ({ mode }: { mode: string }) => {
	const env = loadEnv(mode, process.cwd(), '');
	process.env = Object.assign(process.env, env);
	return defineConfig({ test: { alias: { '@/': new URL('./src/', import.meta.url).pathname } } });
};
