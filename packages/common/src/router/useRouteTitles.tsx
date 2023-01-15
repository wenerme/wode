import { useMatches } from 'react-router-dom';

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
    .filter((v) => v.handle?.title)
    .map((match) => {
      const { data, handle } = match;
      const title = handle.title as RouteHandleTitle;
      if (typeof title === 'function') {
        return title(data, match);
      }
      return String(title);
    });
}

export type RouteHandleTitle =
  | string
  | ((
      data: any,
      match: {
        id: string;
        pathname: string;
        params: Record<string, string>;
        data: unknown;
        handle: unknown;
      },
    ) => string);
