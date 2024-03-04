const __DEV__ = process.env.NODE_ENV === 'development';

export function useExposeDebug(o: Record<string, any>) {
  if (__DEV__) {
    if (typeof window !== 'undefined') {
      const debug = ((window as any).__DEBUG_HOLDER__ ||= {});
      Object.assign(debug, o);
    }
  }
}
