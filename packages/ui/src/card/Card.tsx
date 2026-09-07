import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export const cardVariants = cva('card bg-base-100 text-base-content', {
	variants: {
		variant: {
			default: '',
			border: 'card-border border-base-300',
			dash: 'card-dash border-base-300',
		},
		size: {
			xs: 'card-xs',
			sm: 'card-sm',
			md: 'card-md',
			lg: 'card-lg',
			xl: 'card-xl',
		},
		orientation: {
			vertical: '',
			horizontal: 'card-side',
		},
	},
	defaultVariants: {
		variant: 'default',
		size: 'md',
		orientation: 'vertical',
	},
});

export type CardProps = ComponentPropsWithRef<'div'> & VariantProps<typeof cardVariants>;

export function Card({ className, variant, size, orientation, ...props }: CardProps) {
	return <div data-slot='card' className={cn(cardVariants({ variant, size, orientation }), className)} {...props} />;
}

export type CardFigureProps = ComponentPropsWithRef<'figure'>;

export function CardFigure({ className, ...props }: CardFigureProps) {
	return <figure data-slot='card-figure' className={className} {...props} />;
}

export type CardBodyProps = ComponentPropsWithRef<'div'>;

export function CardBody({ className, ...props }: CardBodyProps) {
	return <div data-slot='card-body' className={cn('card-body', className)} {...props} />;
}

export type CardHeaderProps = ComponentPropsWithRef<'div'>;

export function CardHeader({ className, ...props }: CardHeaderProps) {
	return <div data-slot='card-header' className={cn('grid gap-1.5', className)} {...props} />;
}

export type CardTitleProps = ComponentPropsWithRef<'h3'>;

export function CardTitle({ className, ...props }: CardTitleProps) {
	return <h3 data-slot='card-title' className={cn('card-title', className)} {...props} />;
}

export type CardDescriptionProps = ComponentPropsWithRef<'p'>;

export function CardDescription({ className, ...props }: CardDescriptionProps) {
	return <p data-slot='card-description' className={cn('text-base-content/65 text-sm', className)} {...props} />;
}

export type CardContentProps = ComponentPropsWithRef<'div'>;

export function CardContent({ className, ...props }: CardContentProps) {
	return <div data-slot='card-content' className={className} {...props} />;
}

export type CardFooterProps = ComponentPropsWithRef<'div'>;

export function CardFooter({ className, ...props }: CardFooterProps) {
	return <div data-slot='card-footer' className={cn('card-actions items-center', className)} {...props} />;
}

export const CardCompound = {
	Root: Card,
	Figure: CardFigure,
	Body: CardBody,
	Header: CardHeader,
	Title: CardTitle,
	Description: CardDescription,
	Content: CardContent,
	Footer: CardFooter,
};
