import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentPropsWithRef, useState } from 'react';
import { cn } from '../../utils';

const otpVariants = cva('otp', {
	variants: {
		joined: { true: 'otp-joined', false: '' },
		tone: {
			neutral: 'otp-neutral',
			primary: 'otp-primary',
			secondary: 'otp-secondary',
			accent: 'otp-accent',
			info: 'otp-info',
			success: 'otp-success',
			warning: 'otp-warning',
			error: 'otp-error',
		},
		size: {
			xs: 'otp-xs',
			sm: 'otp-sm',
			md: 'otp-md',
			lg: 'otp-lg',
			xl: 'otp-xl',
		},
	},
	defaultVariants: { joined: false, tone: 'neutral', size: 'md' },
});

export type OtpProps = Omit<
	ComponentPropsWithRef<'input'>,
	'defaultValue' | 'maxLength' | 'onChange' | 'size' | 'value'
> &
	VariantProps<typeof otpVariants> & {
		defaultValue?: string;
		length?: number;
		onValueChange?: (value: string) => void;
		value?: string;
	};

export function Otp({
	className,
	defaultValue = '',
	joined,
	length = 6,
	onValueChange,
	size,
	tone,
	value,
	...props
}: OtpProps) {
	const safeLength = Math.min(8, Math.max(1, Math.trunc(length) || 1));
	const [internalValue, setInternalValue] = useState(() => normalizeOtp(defaultValue, safeLength));
	const currentValue = value === undefined ? internalValue : normalizeOtp(value, safeLength);
	const commit = (nextValue: string) => {
		const next = normalizeOtp(nextValue, safeLength);
		if (value === undefined) setInternalValue(next);
		onValueChange?.(next);
	};

	return (
		<label className={cn(otpVariants({ joined, size, tone }), className)} data-slot='otp'>
			{Array.from({ length: safeLength }, (_, index) => (
				<span key={index} aria-hidden='true' data-slot='otp-slot' />
			))}
			<input
				{...props}
				aria-label={props['aria-label'] ?? '一次性验证码'}
				autoComplete={props.autoComplete ?? 'one-time-code'}
				inputMode={props.inputMode ?? 'numeric'}
				maxLength={safeLength}
				pattern={props.pattern ?? `[0-9]{${safeLength}}`}
				required={props.required ?? true}
				type='text'
				value={currentValue}
				onChange={(event) => commit(event.currentTarget.value)}
			/>
		</label>
	);
}

function normalizeOtp(value: string, length: number) {
	return value.slice(0, length);
}
