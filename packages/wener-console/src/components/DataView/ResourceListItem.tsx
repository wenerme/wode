import { useMemo, type ComponentPropsWithRef, type ReactNode } from 'react';
import { PiCalendarBlank } from 'react-icons/pi';
import { getTitleOfResource, type AnyResource } from '@wener/common/resource';
import { DataViewLayout } from './DataViewLayout';

type IAnyResource = AnyResource & {
	createdBy?: AnyResource;
	updatedBy?: AnyResource;
};

/**
 * Get description from resource
 */
export function getDescriptionOfResource(res?: any): string | undefined {
	if (res && typeof res === 'object') {
		return res.description || res.remark;
	}
	return undefined;
}

/**
 * Format resource title with code
 */
export function formatResourceTitle(data: IAnyResource): ReactNode {
	const { code } = data;
	let primary: ReactNode = data.title || data.fullName;
	let sec = data.displayName;
	primary ||= sec;
	if (sec === primary) {
		sec = undefined;
	}

	return (
		<span className='flex items-center gap-2'>
			{code && <span className='tabular-nums'>{code}</span>}
			{Boolean(primary) && <span className='font-semibold'>{primary}</span>}
			{sec && <small className='font-light'>({sec})</small>}
		</span>
	);
}

/**
 * Format resource meta info (dates, owner, etc.)
 */
export function formatResourceMeta(data: IAnyResource): ReactNode {
	const { createdAt, updatedAt, createdBy, updatedBy } = data;

	const parts: ReactNode[] = [];

	// Created by
	if (createdBy) {
		const creatorName = getTitleOfResource(createdBy);
		if (creatorName) {
			parts.push(
				<span key='creator'>
					创建者: <strong>{creatorName}</strong>
				</span>,
			);
		}
	}

	// Updated by
	if (updatedBy && updatedBy.id !== createdBy?.id) {
		const updaterName = getTitleOfResource(updatedBy);
		if (updaterName) {
			parts.push(
				<span key='updater'>
					更新者: <strong>{updaterName}</strong>
				</span>,
			);
		}
	}

	// Dates
	if (createdAt || updatedAt) {
		const dates: ReactNode[] = [<PiCalendarBlank key='icon' />];

		if (updatedAt) {
			dates.push(
				<span key='updated'>
					{typeof updatedAt === 'string' ? new Date(updatedAt).toLocaleDateString() : updatedAt.toLocaleDateString()}
				</span>,
			);
		}

		if (createdAt && createdAt !== updatedAt) {
			dates.push(
				<span key='created'>
					(创建:{' '}
					{typeof createdAt === 'string' ? new Date(createdAt).toLocaleDateString() : createdAt.toLocaleDateString()})
				</span>,
			);
		}

		parts.push(
			<span key='dates' className='flex items-center gap-1'>
				{dates}
			</span>,
		);
	}

	return parts.length > 0 ? parts.map((p, i) => (i > 0 ? [' • ', p] : p)) : null;
}

export type ResourceListItemProps = Omit<
	ComponentPropsWithRef<typeof DataViewLayout.ListItem>,
	'data' | 'title' | 'description' | 'meta'
> & {
	data: AnyResource;
	showCode?: boolean; // Whether to show resource code in title
	showMeta?: boolean; // Whether to show meta info (dates, creator, etc.)
	customTitle?: (data: AnyResource) => ReactNode;
	customDescription?: (data: AnyResource) => ReactNode;
	customMeta?: (data: AnyResource) => ReactNode;
};

export const ResourceListItem = ({
	data,
	showCode = true,
	showMeta = true,
	customTitle,
	customDescription,
	customMeta,
	...props
}: ResourceListItemProps) => {
	const title = useMemo(() => {
		if (customTitle) return customTitle(data);
		return showCode ? formatResourceTitle(data) : getTitleOfResource(data);
	}, [data, showCode, customTitle]);

	const description = useMemo(() => {
		if (customDescription) return customDescription(data);
		return getDescriptionOfResource(data);
	}, [data, customDescription]);

	const meta = useMemo(() => {
		if (customMeta) return customMeta(data);
		if (!showMeta) return null;
		return formatResourceMeta(data);
	}, [data, showMeta, customMeta]);

	return <DataViewLayout.ListItem {...props} title={title} description={description} meta={meta} />;
};
