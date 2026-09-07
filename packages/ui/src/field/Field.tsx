import { Field as BaseField } from '@base-ui/react/field';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export type FieldProps = ComponentPropsWithRef<typeof BaseField.Root>;

export function Field({ className, ...props }: FieldProps) {
	return <BaseField.Root data-slot='field' className={cn('grid content-start gap-1.5', className)} {...props} />;
}

export type FieldLabelProps = ComponentPropsWithRef<typeof BaseField.Label>;

export function FieldLabel({ className, ...props }: FieldLabelProps) {
	return <BaseField.Label data-slot='field-label' className={cn('label font-medium', className)} {...props} />;
}

export type FieldDescriptionProps = ComponentPropsWithRef<typeof BaseField.Description>;

export function FieldDescription({ className, ...props }: FieldDescriptionProps) {
	return (
		<BaseField.Description
			data-slot='field-description'
			className={cn('text-base-content/65 text-sm', className)}
			{...props}
		/>
	);
}

export type FieldErrorProps = ComponentPropsWithRef<typeof BaseField.Error>;

export function FieldError({ className, ...props }: FieldErrorProps) {
	return <BaseField.Error data-slot='field-error' className={cn('text-error text-sm', className)} {...props} />;
}

export type FieldItemProps = ComponentPropsWithRef<typeof BaseField.Item>;

export function FieldItem({ className, ...props }: FieldItemProps) {
	return <BaseField.Item data-slot='field-item' className={cn('flex items-center gap-2', className)} {...props} />;
}

export const FieldControl = BaseField.Control;
export const FieldValidity = BaseField.Validity;

export const FieldCompound = {
	Root: Field,
	Label: FieldLabel,
	Description: FieldDescription,
	Error: FieldError,
	Item: FieldItem,
	Control: FieldControl,
	Validity: FieldValidity,
};
