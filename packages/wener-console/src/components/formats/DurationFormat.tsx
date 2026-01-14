import { useMemo, type ComponentPropsWithRef, type FC, type ReactNode } from 'react';
import { formatDuration, type MaybeDuration } from '@wener/common/dayjs';

export type DurationFormatProps = {
	value?: MaybeDuration;
	placeholder?: ReactNode;
} & ComponentPropsWithRef<'span'>;

export const DurationFormat: FC<DurationFormatProps> = ({ value, placeholder, ...props }) => {
	const display = useMemo(() => {
		return formatDuration(value);
	}, [value]);
	if (!display) {
		return placeholder;
	}
	return <span {...props}>{display}</span>;
};
