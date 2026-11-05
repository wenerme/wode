import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(typeof __filename === 'string' ? __filename : import.meta.url);

/** Resolve from this module (or the bundled CLI), never from the caller's cwd. */
export function resolvePdfAsset(specifier: string): string {
	return require.resolve(specifier);
}

export async function loadPdfJs() {
	const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
	pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(resolvePdfAsset('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
	return pdfjs;
}

export function pdfJsDocumentOptions() {
	const root = path.dirname(resolvePdfAsset('pdfjs-dist/package.json'));
	return {
		cMapUrl: `${path.join(root, 'cmaps')}${path.sep}`,
		cMapPacked: true,
		standardFontDataUrl: `${path.join(root, 'standard_fonts')}${path.sep}`,
		wasmUrl: `${path.join(root, 'wasm')}${path.sep}`,
		useSystemFonts: false,
	};
}
