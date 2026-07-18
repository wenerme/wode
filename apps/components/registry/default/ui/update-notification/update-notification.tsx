'use client';

import type { ReactNode } from 'react';
import {
	UpdateNotificationBanner,
	type UpdateNotificationDisplayBaseProps,
	UpdateNotificationInline,
	UpdateNotificationToast,
} from './update-notification-display';
import {
	type UpdateNotificationController,
	type UseUpdateNotificationOptions,
	useUpdateNotification,
} from './use-update-notification';

export type UpdateNotificationDisplay = 'toast' | 'banner' | 'inline';

export type UpdateNotificationProps = UseUpdateNotificationOptions & {
	display?: UpdateNotificationDisplay;
	labels?: UpdateNotificationDisplayBaseProps['labels'];
	onRefresh?: UpdateNotificationDisplayBaseProps['onRefresh'];
	className?: string;
	render?: (notification: UpdateNotificationController) => ReactNode;
};

export type UpdateNotificationPresenterProps = UpdateNotificationDisplayBaseProps & {
	display?: UpdateNotificationDisplay;
	className?: string;
};

export function UpdateNotification({
	display = 'toast',
	labels,
	onRefresh,
	className,
	render,
	...options
}: UpdateNotificationProps) {
	const notification = useUpdateNotification(options);
	if (render) return render(notification);
	return (
		<UpdateNotificationPresenter
			display={display}
			notification={notification}
			labels={labels}
			onRefresh={onRefresh}
			className={className}
		/>
	);
}

export function UpdateNotificationPresenter({
	display = 'toast',
	notification,
	labels,
	onRefresh,
	className,
}: UpdateNotificationPresenterProps) {
	const props = { notification, labels, onRefresh, className };
	switch (display) {
		case 'banner':
			return <UpdateNotificationBanner {...props} />;
		case 'inline':
			return <UpdateNotificationInline {...props} />;
		default:
			return <UpdateNotificationToast {...props} />;
	}
}
