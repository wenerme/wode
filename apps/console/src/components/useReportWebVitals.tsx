import { useEffect } from 'react';
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

export function useReportWebVitals(reportWebVitalsFn: (metric: Metric) => void) {
	useEffect(() => {
		onCLS(reportWebVitalsFn);
		onLCP(reportWebVitalsFn);
		onINP(reportWebVitalsFn);
		onFCP(reportWebVitalsFn);
		onTTFB(reportWebVitalsFn);
	}, [reportWebVitalsFn]);
}
