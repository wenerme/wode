import { copy } from '@wener/utils';
import type React from 'react';
import { HiMiniDocumentDuplicate } from 'react-icons/hi2';
import { showSuccessToast } from '../../toast';
import { EmptyPlaceholder } from './EmptyPlaceholder';
import { formatPhoneNumber } from './formatPhoneNumber';

export interface PhoneNumberFormatProps {
	value?: string;
	unmask?: boolean;
	placeholder?: string;
}

export const PhoneNumberFormat: React.FC<PhoneNumberFormatProps> = ({
	value,
	placeholder = <EmptyPlaceholder />,
	unmask,
}) => {
	if (!value) {
		return placeholder;
	}
	return (
		<span className={'group inline-flex items-center'}>
			{formatPhoneNumber(value, { mask: !unmask }) || placeholder}
			{value && (
				<button
					type={'button'}
					onClick={() => {
						copy(value);
						showSuccessToast('已复制');
					}}
					className={'btn-xs btn btn-square btn-ghost opacity-50 transition group-hover:opacity-100'}
				>
					<HiMiniDocumentDuplicate />
				</button>
			)}
		</span>
	);
};
