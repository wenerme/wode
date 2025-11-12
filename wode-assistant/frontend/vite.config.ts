import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import wails from '@wailsio/runtime/plugins/vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		wails('./src/bindings'),
	],
	esbuild: {
		// Skip tsconfig.json parsing to avoid errors from workspace packages
		tsconfigRaw: {
			compilerOptions: {
				experimentalDecorators: true,
			},
		},
	},
	build: {
		rollupOptions: {
			onwarn(warning, defaultHandler) {
				// Ignore tsconfig.json parsing errors from workspace packages
				if (warning.message?.includes('tsconfig.json')) {
					return;
				}
				defaultHandler(warning);
			},
		},
	},
	optimizeDeps: {
		esbuildOptions: {
			// Ignore missing tsconfig.json files
			tsconfigRaw: {
				compilerOptions: {
					experimentalDecorators: true,
				},
			},
		},
	},
});
