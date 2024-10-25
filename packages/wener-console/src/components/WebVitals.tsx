'use client';

import { useReportWebVitals } from './useReportWebVitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric);
  });
  return null;
}
