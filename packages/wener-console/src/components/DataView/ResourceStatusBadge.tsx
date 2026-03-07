import { ResourceStatusSchema } from '@wener/common/resource/schema';
import { getSchemaOptionLabel, type TypeSchema } from '@wener/common/schema';
import { cn } from '@wener/console';
import type { ComponentPropsWithRef } from 'react';

export const ResourceStatusBadge = ({
	data,
	status = data?.status,
	reason = data?.statusReason,
	state = data?.state,
	schema = ResourceStatusSchema,
	className,
	success,
	warning,
	error,
	// resource = findResourceSchema(data),
	...props
}: Omit<ComponentPropsWithRef<'div'>, 'resource'> & {
	state?: string | null;
	status?: string | null;
	reason?: string | null;
	data?: {
		id?: string | null;
		status?: string | null;
		statusReason?: string | null;
		state?: string | null;
	};
	// resource?: ResourceSchemaDef;
	schema?: TypeSchema;
	success?: string[];
	warning?: string[];
	error?: string[];
}) => {
	if (!status) {
		return null;
	}

	let classNames = '';
	if (success?.includes(status)) {
		classNames = 'badge-success';
	} else if (warning?.includes(status)) {
		classNames = 'badge-warning';
	} else if (error?.includes(status)) {
		classNames = 'badge-error';
	}
	const label = getSchemaOptionLabel(schema, status) || status;
	return (
		<div className={cn('badge badge-soft', classNames, className)} {...props}>
			{label}
		</div>
	);
};
