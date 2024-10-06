import { useEffect, useState } from 'react';

export function usePageVisibility() {
  const [visible, setVisible] = useState(typeof document === 'undefined' ? true : !document.hidden);
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const onChange = () => {
      setVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', onChange);
    return () => {
      document.removeEventListener('visibilitychange', onChange);
    };
  }, []);
  return visible;
}
