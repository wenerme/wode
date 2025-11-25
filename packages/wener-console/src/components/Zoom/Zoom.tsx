import React, { lazy, Suspense, useCallback, useEffect, type FC } from 'react';
import type { ControlledProps } from 'react-medium-image-zoom';
import { useControllable } from '@wener/reaction';

export type ZoomProps = {
	active?: boolean;
	onActiveChange?: (v: boolean) => void;
} & Omit<ControlledProps, 'isZoomed' | 'onZoomChange'>;

const Controlled = lazy(() => import('react-medium-image-zoom').then(({ Controlled }) => ({ default: Controlled })));

export const Zoom: FC<ZoomProps> = ({ active, onActiveChange, children, ...props }) => {
	const [isZoomed, onZoomChange] = useControllable(active, onActiveChange, false);

	useEffect(() => {
		import('react-medium-image-zoom/dist/styles.css').catch((err) => {
			console.error('Failed to load react-medium-image-zoom styles', err);
		});
	}, []);

	return (
		<Suspense>
			<Controlled
				{...props}
				a11yNameButtonUnzoom={'缩小'}
				a11yNameButtonZoom={'放大'}
				isZoomed={isZoomed}
				onZoomChange={useCallback((v: boolean) => {
					onZoomChange(v);
				}, [])}
			>
				{children}
			</Controlled>
		</Suspense>
	);
};

function useInjectScript(fn: () => Promise<{ default: any }>) {
	const [content, setContent] = React.useState<string | null>(null);
	useEffect(() => {
		fn().then((v) => {
			setContent(v.default);
		});
	}, []);
}

interface Module {
	[Symbol.toStringTag]: 'Module';
	default?: any;

	[k: string | symbol]: any;
}
