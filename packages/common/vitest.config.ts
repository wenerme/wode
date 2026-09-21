import process from 'node:process';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default ({ mode }: { mode: string }) => {
	const env = loadEnv(mode, process.cwd(), '');
	process.env = Object.assign(process.env, env);
	return defineConfig({ test: { alias: { '@/': new URL('./src/', import.meta.url).pathname } } });
};
