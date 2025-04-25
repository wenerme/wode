import { useAsyncEffect } from '@wener/reaction';
import { type Metric } from 'web-vitals';

export function useReportWebVitals(reportWebVitalsFn: (metric: Metric) => void) {
	useAsyncEffect(async () => {
		// delay the loading of web-vitals.js, avoid ad block
		const { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } = await import('web-vitals');
		onCLS(reportWebVitalsFn);
		onFID(reportWebVitalsFn);
		onLCP(reportWebVitalsFn);
		onINP(reportWebVitalsFn);
		onFCP(reportWebVitalsFn);
		onTTFB(reportWebVitalsFn);
	}, [reportWebVitalsFn]);
}
