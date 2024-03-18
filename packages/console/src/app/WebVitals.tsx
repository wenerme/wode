'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  if (process.env.NODE_ENV === 'development') {
    return null;
  }
  useReportWebVitals((metric) => {
    console.log(metric);
  });
  return null;
}
