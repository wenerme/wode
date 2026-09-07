import type { ChangeEvent, ComponentPropsWithRef, ReactNode, Ref } from 'react';
import type {
	ControllerFieldState,
	ControllerRenderProps,
	FieldErrors,
	FieldPath,
	FieldValues,
	UseControllerProps,
	UseFormProps,
	UseFormReturn,
	UseFormStateReturn,
} from 'react-hook-form';

export type HookFormSubmitHandler<TFieldValues extends FieldValues = FieldValues, TContext = unknown> = (
	data: TFieldValues,
	methods: UseFormReturn<TFieldValues, TContext>,
) => void | Promise<void>;

export type HookFormInvalidHandler<TFieldValues extends FieldValues = FieldValues, TContext = unknown> = (
	errors: FieldErrors<TFieldValues>,
	methods: UseFormReturn<TFieldValues, TContext>,
) => void;

export type HookFormProps<TFieldValues extends FieldValues = FieldValues, TContext = unknown> = UseFormProps<
	TFieldValues,
	TContext
> & {
	children?: ReactNode;
	formProps?: Omit<ComponentPropsWithRef<'form'>, 'children' | 'onSubmit' | 'ref'>;
	formRef?: Ref<HTMLFormElement>;
	methodsRef?: Ref<UseFormReturn<TFieldValues, TContext>>;
	onInvalid?: HookFormInvalidHandler<TFieldValues, TContext>;
	onSubmit?: HookFormSubmitHandler<TFieldValues, TContext>;
	preventImplicitSubmit?: boolean;
};

export type HookFormFieldContext<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	describedBy?: string;
	errorId: string;
	field: ControllerRenderProps<TFieldValues, TName>;
	fieldState: ControllerFieldState;
	formState: UseFormStateReturn<TFieldValues>;
	hintId: string;
	id: string;
	invalid: boolean;
};

export type HookFormFieldProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> & {
	checkedValue?: unknown;
	className?: string;
	controlType?: 'input' | 'textarea';
	description?: ReactNode;
	hint?: ReactNode;
	inputClassName?: string;
	inputProps?: Omit<ComponentPropsWithRef<'input'>, 'defaultValue' | 'name' | 'onBlur' | 'onChange' | 'ref' | 'value'>;
	isChecked?: (value: unknown, checkedValue: unknown) => boolean;
	label?: ReactNode;
	parse?: (value: string, event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => unknown;
	render?: (context: HookFormFieldContext<TFieldValues, TName>) => ReactNode;
	required?: boolean | string;
	size?: 'xs' | 'sm' | 'md' | 'lg';
	textareaProps?: Omit<
		ComponentPropsWithRef<'textarea'>,
		'defaultValue' | 'name' | 'onBlur' | 'onChange' | 'ref' | 'value'
	>;
	type?: ComponentPropsWithRef<'input'>['type'];
	uncheckedValue?: unknown;
};

export type HookFormErrorSummaryProps = ComponentPropsWithRef<'div'> & {
	errors?: FieldErrors;
	includePath?: boolean;
	maxItems?: number;
	title?: ReactNode;
};

export type HookFormSubmitButtonProps = ComponentPropsWithRef<'button'> & {
	dirtyOnly?: boolean;
	loadingText?: ReactNode;
	showSpinner?: boolean;
};

export type HookFormDebugButtonProps = ComponentPropsWithRef<'button'> & {
	enabled?: boolean;
};

export type HookFormDataPreviewButtonProps<TFieldValues extends FieldValues = FieldValues> =
	ComponentPropsWithRef<'button'> & {
		dialogTitle?: ReactNode;
		format?: (data: TFieldValues) => string;
		onLoad?: (data: TFieldValues) => void;
		onParseError?: (error: unknown) => void;
		parse?: (text: string) => TFieldValues | Promise<TFieldValues>;
		textareaLabel?: string;
	};
