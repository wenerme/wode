'use client';

import {
	type ComponentPropsWithRef,
	createContext,
	type ElementType,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {
	type BooleanInput,
	type DateInput,
	type DurationInput,
	type DurationUnit,
	type FormatBytesOptions,
	type FormatLocale,
	type FormatPhoneNumberOptions,
	formatBoolean,
	formatBytes,
	formatCurrency,
	formatDateTime,
	formatDecimal,
	formatDuration,
	formatNumber,
	formatPercent,
	formatPhoneNumber,
	formatRelativeTime,
	getRelativeTimeUpdateInterval,
	type NumberInput,
	parseDateValue,
} from './format-values';

export type FormatConfig = {
	currency?: string;
	fallback?: string;
	locale?: FormatLocale;
	placeholder?: ReactNode;
	timeZone?: string;
};

export type FormatProviderProps = {
	children?: ReactNode;
	value?: FormatConfig;
};

export type EmptyPlaceholderProps = ComponentPropsWithRef<'span'> & {
	as?: ElementType;
};

export type TruncateFormatProps = ComponentPropsWithRef<'span'> & {
	as?: ElementType;
	placeholder?: ReactNode;
	value?: ReactNode;
};

export type ValueFormatProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & {
	placeholder?: ReactNode;
};

export type NumberFormatProps = ValueFormatProps & {
	fallback?: string;
	formatOptions?: Intl.NumberFormatOptions;
	locale?: FormatLocale;
	value?: NumberInput;
};

export type DecimalFormatProps = NumberFormatProps;

export type CurrencyFormatProps = ValueFormatProps & {
	currency?: string;
	fallback?: string;
	formatOptions?: Intl.NumberFormatOptions;
	locale?: FormatLocale;
	value?: NumberInput;
};

export type PercentFormatProps = ValueFormatProps & {
	fallback?: string;
	formatOptions?: Intl.NumberFormatOptions;
	input?: 'ratio' | 'percent';
	locale?: FormatLocale;
	value?: NumberInput;
};

export type BytesFormatProps = ValueFormatProps &
	FormatBytesOptions & {
		value?: NumberInput;
	};

export type DurationFormatProps = ValueFormatProps & {
	durationStyle?: 'compact' | 'digital' | 'iso';
	fallback?: string;
	maxParts?: number;
	showZero?: boolean;
	unit?: DurationUnit;
	value?: DurationInput;
};

export type DateTimeFormatProps = Omit<ComponentPropsWithRef<'time'>, 'dateTime'> & {
	fallback?: string;
	formatOptions?: Intl.DateTimeFormatOptions;
	live?: boolean;
	locale?: FormatLocale;
	placeholder?: ReactNode;
	relative?: boolean;
	timeZone?: string;
	tooltip?: boolean;
	value?: DateInput;
};

export type DateFormatProps = DateTimeFormatProps;
export type TimeFormatProps = DateTimeFormatProps;

export type RelativeTimeFormatProps = Omit<ComponentPropsWithRef<'time'>, 'dateTime'> & {
	live?: boolean;
	locale?: FormatLocale;
	now?: DateInput;
	placeholder?: ReactNode;
	titleOptions?: Intl.DateTimeFormatOptions;
	value?: DateInput;
};

export type BooleanFormatProps = ValueFormatProps & {
	badge?: boolean;
	fallback?: string;
	falseText?: string;
	trueText?: string;
	value?: BooleanInput;
};

export type PhoneNumberFormatProps = ValueFormatProps &
	FormatPhoneNumberOptions & {
		value?: string | null;
	};

const FormatConfigContext = createContext<FormatConfig>({});

export function FormatProvider({ children, value }: FormatProviderProps) {
	const parent = useFormatConfig();
	const next = useMemo(() => ({ ...parent, ...value }), [parent, value]);
	return <FormatConfigContext.Provider value={next}>{children}</FormatConfigContext.Provider>;
}

export function useFormatConfig() {
	return useContext(FormatConfigContext);
}

export function EmptyPlaceholder({ as: Component = 'span', children, className, ...props }: EmptyPlaceholderProps) {
	const config = useFormatConfig();
	return (
		<Component className={joinClassNames('text-base-content/60', className)} {...props}>
			{children ?? config.placeholder ?? config.fallback ?? '—'}
		</Component>
	);
}

export function TruncateFormat({
	as: Component = 'span',
	children,
	className,
	placeholder,
	title,
	value,
	...props
}: TruncateFormatProps) {
	const content = children ?? value;
	if (isEmptyRenderable(content)) return <>{resolvePlaceholder(placeholder)}</>;
	const textTitle = title ?? (typeof content === 'string' || typeof content === 'number' ? String(content) : undefined);
	return (
		<Component
			className={joinClassNames('inline-block max-w-full truncate align-bottom', className)}
			title={textTitle}
			{...props}
		>
			{content}
		</Component>
	);
}

export function NumberFormat({
	className,
	fallback,
	formatOptions,
	locale,
	placeholder,
	value,
	...props
}: NumberFormatProps) {
	const config = useFormatConfig();
	return (
		<ValueText
			{...props}
			className={className}
			placeholder={placeholder}
			value={formatNumber(value, { fallback, locale: locale ?? config.locale, ...formatOptions })}
		/>
	);
}

export function DecimalFormat({
	className,
	fallback,
	formatOptions,
	locale,
	placeholder,
	value,
	...props
}: DecimalFormatProps) {
	const config = useFormatConfig();
	return (
		<ValueText
			{...props}
			className={className}
			placeholder={placeholder}
			value={formatDecimal(value, { fallback, locale: locale ?? config.locale, ...formatOptions })}
		/>
	);
}

export function CurrencyFormat({
	value,
	placeholder,
	locale,
	currency,
	fallback,
	formatOptions,
	className,
	...props
}: CurrencyFormatProps) {
	const config = useFormatConfig();
	return (
		<ValueText
			{...props}
			className={joinClassNames('tabular-nums', className)}
			placeholder={placeholder}
			value={formatCurrency(value, {
				currency: currency ?? config.currency,
				fallback,
				locale: locale ?? config.locale,
				...formatOptions,
			})}
		/>
	);
}

export function PercentFormat({
	className,
	fallback,
	formatOptions,
	input,
	locale,
	placeholder,
	value,
	...props
}: PercentFormatProps) {
	const config = useFormatConfig();
	return (
		<ValueText
			{...props}
			className={joinClassNames('tabular-nums', className)}
			placeholder={placeholder}
			value={formatPercent(value, { fallback, input, locale: locale ?? config.locale, ...formatOptions })}
		/>
	);
}

export function BytesFormat({
	base,
	binary,
	className,
	fallback,
	maximumFractionDigits,
	minimumFractionDigits,
	placeholder,
	value,
	...props
}: BytesFormatProps) {
	return (
		<ValueText
			{...props}
			className={joinClassNames('tabular-nums', className)}
			placeholder={placeholder}
			value={formatBytes(value, { base, binary, fallback, maximumFractionDigits, minimumFractionDigits })}
		/>
	);
}

export function DurationFormat({
	className,
	durationStyle,
	fallback,
	maxParts,
	placeholder,
	showZero,
	unit,
	value,
	...props
}: DurationFormatProps) {
	return (
		<ValueText
			{...props}
			className={joinClassNames('tabular-nums', className)}
			placeholder={placeholder}
			value={formatDuration(value, { fallback, maxParts, showZero, style: durationStyle, unit })}
		/>
	);
}

export function DateTimeFormat({
	className,
	fallback,
	formatOptions,
	live = false,
	locale,
	placeholder,
	relative = false,
	timeZone,
	tooltip = relative,
	value,
	...props
}: DateTimeFormatProps) {
	const config = useFormatConfig();
	const now = useRelativeNow(value, live && relative);
	const date = parseDateValue(value);
	if (!date) return <>{resolvePlaceholder(placeholder)}</>;
	const dateTimeOptions = formatOptions ?? { dateStyle: 'medium' as const, timeStyle: 'short' as const };
	const absolute = formatDateTime(value, {
		...dateTimeOptions,
		fallback,
		locale: locale ?? config.locale,
		timeZone: timeZone ?? config.timeZone,
	});
	const text = relative ? formatRelativeTime(value, { fallback, locale: locale ?? config.locale, now }) : absolute;
	return (
		<time className={className} dateTime={date.toISOString()} title={tooltip ? absolute : props.title} {...props}>
			{text}
		</time>
	);
}

export function DateFormat({ formatOptions, ...props }: DateFormatProps) {
	return <DateTimeFormat formatOptions={{ dateStyle: 'medium', ...formatOptions }} {...props} />;
}

export function TimeFormat({ formatOptions, ...props }: TimeFormatProps) {
	return <DateTimeFormat formatOptions={{ timeStyle: 'short', ...formatOptions }} {...props} />;
}

export function RelativeTimeFormat({
	className,
	live = true,
	locale,
	now,
	placeholder,
	titleOptions,
	value,
	...props
}: RelativeTimeFormatProps) {
	const config = useFormatConfig();
	const currentNow = useRelativeNow(value, live, now);
	const date = parseDateValue(value);
	if (!date) return <>{resolvePlaceholder(placeholder)}</>;
	const title = formatDateTime(value, {
		dateStyle: 'medium',
		timeStyle: 'short',
		...titleOptions,
		locale: locale ?? config.locale,
		timeZone: config.timeZone,
	});
	return (
		<time className={className} dateTime={date.toISOString()} title={title} {...props}>
			{formatRelativeTime(value, { locale: locale ?? config.locale, now: currentNow })}
		</time>
	);
}

export function BooleanFormat({
	badge = true,
	className,
	fallback,
	falseText,
	placeholder,
	trueText,
	value,
	...props
}: BooleanFormatProps) {
	const text = formatBoolean(value, { fallback, falseText, trueText });
	if (isFallbackText(text, fallback)) return <>{resolvePlaceholder(placeholder)}</>;
	return (
		<span
			{...props}
			className={joinClassNames(
				badge && 'badge badge-sm',
				badge && text === (trueText ?? '是') && 'badge-success',
				badge && text === (falseText ?? '否') && 'badge-ghost',
				className,
			)}
		>
			{text}
		</span>
	);
}

export function PhoneNumberFormat({
	className,
	fallback,
	mask,
	placeholder,
	separator,
	value,
	...props
}: PhoneNumberFormatProps) {
	const text = formatPhoneNumber(value, { fallback, mask, separator });
	if (isFallbackText(text, fallback)) return <>{resolvePlaceholder(placeholder)}</>;
	return (
		<span {...props} className={joinClassNames('font-mono tabular-nums', className)}>
			{text}
		</span>
	);
}

export const AmountFormat = CurrencyFormat;
export const FormatAmount = CurrencyFormat;
export const FormatBoolean = BooleanFormat;
export const FormatBytes = BytesFormat;
export const FormatCurrency = CurrencyFormat;
export const FormatDate = DateFormat;
export const FormatDateTime = DateTimeFormat;
export const FormatDecimal = DecimalFormat;
export const FormatDuration = DurationFormat;
export const FormatNumber = NumberFormat;
export const FormatPercent = PercentFormat;
export const FormatPhoneNumber = PhoneNumberFormat;
export const FormatRelativeTime = RelativeTimeFormat;
export const FormatTime = TimeFormat;

function ValueText({
	className,
	placeholder,
	value,
	...props
}: Omit<ComponentPropsWithRef<'span'>, 'children'> & { placeholder?: ReactNode; value: string }) {
	if (isFallbackText(value)) return <>{resolvePlaceholder(placeholder)}</>;
	return (
		<span {...props} className={className}>
			{value}
		</span>
	);
}

function resolvePlaceholder(placeholder?: ReactNode) {
	return placeholder ?? <EmptyPlaceholder />;
}

function useRelativeNow(value: DateInput, enabled: boolean, fixedNow?: DateInput) {
	const [now, setNow] = useState(() => fixedNow ?? Date.now());
	useEffect(() => {
		if (!enabled || fixedNow !== undefined) return;
		let handle: number | undefined;
		const schedule = () => {
			const interval = getRelativeTimeUpdateInterval(value);
			if (!interval) return;
			handle = window.setTimeout(() => {
				setNow(Date.now());
				schedule();
			}, interval);
		};
		schedule();
		return () => {
			if (handle) window.clearTimeout(handle);
		};
	}, [enabled, fixedNow, value]);
	return fixedNow ?? now;
}

function isEmptyRenderable(value: ReactNode) {
	return value === null || value === undefined || value === '';
}

function isFallbackText(value: string, fallback = '—') {
	return value === fallback;
}

function joinClassNames(...classNames: Array<string | false | undefined>) {
	return classNames.filter(Boolean).join(' ');
}
