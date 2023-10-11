'use client';

import { isProd } from '@wener/console';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (isProd()) {
      console.log(metric);
    }
  });
  return null;
}
