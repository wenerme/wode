import { useAsyncEffect } from '@wener/reaction';
import { type Metric } from 'web-vitals';

export function useReportWebVitals(reportWebVitalsFn: (metric: Metric) => void) {
	useAsyncEffect(async () => {
		// delay the loading of web-vitals.js, avoid ad block
		try {
			const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals');
			onCLS(reportWebVitalsFn);
			onLCP(reportWebVitalsFn);
			onINP(reportWebVitalsFn);
			onFCP(reportWebVitalsFn);
			onTTFB(reportWebVitalsFn);
		} catch (e) {
			console.error(`failed to handle load web-vitals`, e);
		}
	}, [reportWebVitalsFn]);
}
