import { useEffect } from 'react';
import { useInRouterContext, useLocation } from 'react-router';
import { useRouteTitles } from '../../router';

type MatomoWindow = Window & {
	Matomo?: {
		getTracker?: () => {
			setCustomUrl: (url: string) => void;
			setDocumentTitle: (title: string) => void;
			trackPageView: () => void;
		};
	};
};

export const ReactRouterTracker = () => {
	if (!useInRouterContext()) {
		return null;
	}

	const titles = useRouteTitles();
	const loc = useLocation();
	useEffect(() => {
		const tracker = (window as MatomoWindow).Matomo?.getTracker?.();
		if (!tracker) {
			return;
		}
		tracker.setCustomUrl(loc.pathname);
		tracker.setDocumentTitle(titles.join('/'));
		tracker.trackPageView();
	}, [loc.pathname]);
	return null;
};
