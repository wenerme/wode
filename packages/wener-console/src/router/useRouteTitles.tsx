import { useMatches } from 'react-router-dom';
import type { KnownRouteObjectHandle } from './index';

export function useRouteTitles(id?: string): string[] {
  let matches = useMatches();
  if (id) {
    const i = matches.findIndex((match) => match.id === id);
    if (i < 0) {
      return [];
    }
    matches = matches.slice(0, i + 1);
  }
  return matches
    .filter((v) => (v.handle as KnownRouteObjectHandle)?.title)
    .map((match) => {
      const { data, handle } = match;
      const title = (handle as KnownRouteObjectHandle).title;
      if (typeof title === 'function') {
        return title(data, match as any);
      }
      return String(title);
    });
}
