export function useIsDev() {
  return process.env.NODE_ENV === 'development';
}

export function useIsProd() {
  return !useIsDev();
}

export function useIsClient() {
  return typeof window !== 'undefined' && typeof location !== 'undefined';
}

let _isNextJS: boolean | undefined;

export function useIsNextJS() {
  return (_isNextJS ||= Boolean((globalThis as any).next?.version));
}
