import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const tableVariants = cva('table', {
	variants: {
		size: {
			xs: 'table-xs',
			sm: 'table-sm',
			md: 'table-md',
			lg: 'table-lg',
			xl: 'table-xl',
		},
		zebra: {
			true: 'table-zebra',
			false: '',
		},
		pinRows: {
			true: 'table-pin-rows',
			false: '',
		},
		pinColumns: {
			true: 'table-pin-cols',
			false: '',
		},
	},
	defaultVariants: {
		size: 'md',
		zebra: false,
		pinRows: false,
		pinColumns: false,
	},
});

export type TableProps = ComponentPropsWithRef<'table'> &
	VariantProps<typeof tableVariants> & {
		containerClassName?: string;
	};

export function Table({ className, containerClassName, size, zebra, pinRows, pinColumns, ...props }: TableProps) {
	return (
		<div data-slot='table-container' className={cn('w-full overflow-x-auto', containerClassName)}>
			<table
				data-slot='table'
				className={cn(tableVariants({ size, zebra, pinRows, pinColumns }), className)}
				{...props}
			/>
		</div>
	);
}

export type TableHeaderProps = ComponentPropsWithRef<'thead'>;
export type TableBodyProps = ComponentPropsWithRef<'tbody'>;
export type TableFooterProps = ComponentPropsWithRef<'tfoot'>;
export type TableRowProps = ComponentPropsWithRef<'tr'>;
export type TableHeadProps = ComponentPropsWithRef<'th'>;
export type TableCellProps = ComponentPropsWithRef<'td'>;
export type TableCaptionProps = ComponentPropsWithRef<'caption'>;

export function TableHeader({ className, ...props }: TableHeaderProps) {
	return <thead data-slot='table-header' className={className} {...props} />;
}

export function TableBody({ className, ...props }: TableBodyProps) {
	return <tbody data-slot='table-body' className={className} {...props} />;
}

export function TableFooter({ className, ...props }: TableFooterProps) {
	return <tfoot data-slot='table-footer' className={className} {...props} />;
}

export function TableRow({ className, ...props }: TableRowProps) {
	return <tr data-slot='table-row' className={className} {...props} />;
}

export function TableHead({ className, ...props }: TableHeadProps) {
	return <th data-slot='table-head' className={className} {...props} />;
}

export function TableCell({ className, ...props }: TableCellProps) {
	return <td data-slot='table-cell' className={className} {...props} />;
}

export function TableCaption({ className, ...props }: TableCaptionProps) {
	return (
		<caption data-slot='table-caption' className={cn('text-base-content/65 mt-3 text-sm', className)} {...props} />
	);
}
