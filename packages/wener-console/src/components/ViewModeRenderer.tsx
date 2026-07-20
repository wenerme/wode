import { type FlexRenderable, flexRender } from '@wener/reaction';
import type { ViewMode } from './ViewModeInput';

export const ViewModeRenderer = ({
	views = {},
	useViewMode,
	viewMode = useViewMode?.(),
	fallback = true,
	...props
}: {
	views?: Partial<Record<ViewMode, FlexRenderable<any>>>;
	viewMode?: ViewMode;
	useViewMode?: () => ViewMode | undefined;
	fallback?: FlexRenderable<any> | boolean;
	[key: string]: any;
}) => {
	let view = views?.[viewMode!];
	if (!view) {
		if (fallback === true) {
			view = Object.values(views).find((v) => v);
		} else if (fallback) {
			view = fallback;
		} else {
			console.warn(`No view found for mode: ${viewMode}`);
		}
	}
	return flexRender(view, { key: viewMode, ...props });
};
