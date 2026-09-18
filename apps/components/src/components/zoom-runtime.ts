let documentScrollLockCount = 0;
let documentScrollLockPreviousOverflow = '';

export function acquireDocumentScrollLock() {
	const root = document.documentElement;
	if (documentScrollLockCount === 0) {
		documentScrollLockPreviousOverflow = root.style.overflow;
		root.style.overflow = 'hidden';
	}
	documentScrollLockCount += 1;
	let released = false;
	return () => {
		if (released) return;
		released = true;
		documentScrollLockCount = Math.max(0, documentScrollLockCount - 1);
		if (documentScrollLockCount === 0) {
			root.style.overflow = documentScrollLockPreviousOverflow;
			documentScrollLockPreviousOverflow = '';
		}
	};
}

export function prefersReducedMotion() {
	return (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}
