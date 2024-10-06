import React from 'react';

export function useMediaQuery(query: string): boolean | undefined {
  // Keep track of the preference in state, start with the current match
  const [matches, setMatches] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return;
  });

  // Watch for changes
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const matcher = window.matchMedia(query);
    const onChange = ({ matches }: { matches: boolean }) => setMatches(matches);
    matcher.addEventListener('change', onChange);

    return () => matcher.removeEventListener('change', onChange);
  }, [query, setMatches]);

  return matches;
}
