import React, { useMemo, type ComponentPropsWithRef, type ReactNode } from 'react';
import { dayjs } from '@wener/common/dayjs';
import { EmptyPlaceholder } from './EmptyPlaceholder';

export const DateFormat = ({
	value,
	placeholder = <EmptyPlaceholder />,
	format = 'YYYY-MM-DD',
	...props
}: {
	value?: Date | string | number | null;
	placeholder?: ReactNode;
	format?: string;
} & ComponentPropsWithRef<'span'>) => {
	const o = useMemo(() => {
		return formatDate({ value, format });
	}, [value, format]);
	if (!o) {
		return placeholder;
	}
	return <span {...props}>{o}</span>;
};

type MaybeDate = Date | string | number | null | undefined;

function formatDate({ value, format }: { value: MaybeDate; format?: string }) {
	if (!value) return '';
	const d = dayjs(value);
	if (!d.isValid()) {
		return '';
	}
	return d.format(format);
}
