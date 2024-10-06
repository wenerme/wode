import { useMatches, type UIMatch } from 'react-router-dom';
import type { MaybeFunction } from '@wener/utils';

interface RouteObjectHandleWithTitle {
  title: RouteHandleTitle;

  [key: string]: any;
}

type RouteHandleTitle = MaybeFunction<string, [data: any, match: UIMatch<unknown, RouteObjectHandleWithTitle>]>;

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
    .filter((v) => (v.handle as RouteObjectHandleWithTitle)?.title)
    .map((match) => {
      const { data, handle } = match;
      const title = (handle as RouteObjectHandleWithTitle).title;
      if (typeof title === 'function') {
        return title(data, match as any);
      }
      return String(title);
    });
}
