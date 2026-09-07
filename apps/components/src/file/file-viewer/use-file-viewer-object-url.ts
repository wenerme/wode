'use client';

import { useEffect, useState } from 'react';
import type { FileViewerBytes } from './file-viewer-types';

type ObjectUrlState = {
	bytes: FileViewerBytes;
	mimeType: string;
	url: string;
};

export function useFileViewerObjectUrl(bytes: FileViewerBytes | undefined, mimeType: string): string | undefined {
	const [state, setState] = useState<ObjectUrlState>();

	useEffect(() => {
		if (!bytes || typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
			setState(undefined);
			return;
		}
		const url = URL.createObjectURL(new Blob([copyFileViewerBytes(bytes)], { type: mimeType }));
		setState({ bytes, mimeType, url });
		return () => URL.revokeObjectURL(url);
	}, [bytes, mimeType]);

	return state && state.bytes === bytes && state.mimeType === mimeType ? state.url : undefined;
}

export function copyFileViewerBytes(bytes: FileViewerBytes): ArrayBuffer {
	if (bytes instanceof Uint8Array) return bytes.slice().buffer;
	return bytes.slice(0);
}
