import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite-plus';
import { registryAliases } from './vite-registry-aliases';

export default defineConfig({
	plugins: [react(), tailwindcss()] as PluginOption[],
	resolve: {
		alias: registryAliases,
	},
});
