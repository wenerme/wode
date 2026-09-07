import { defineConfig } from 'vite-plus';

export default defineConfig({ test: { alias: { '@/': new URL('./src/', import.meta.url).pathname } } });
