import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils';

export type AccordionProps = ComponentPropsWithRef<typeof BaseAccordion.Root>;

export function Accordion({ className, ...props }: AccordionProps) {
	return <BaseAccordion.Root data-slot='accordion' className={cn('grid gap-2', className)} {...props} />;
}

export const accordionItemVariants = cva(
	'collapse border-base-300 bg-base-100 data-open:collapse-open data-closed:collapse-close border',
	{
		variants: {
			indicator: {
				none: '',
				arrow: 'collapse-arrow',
				plus: 'collapse-plus',
			},
		},
		defaultVariants: {
			indicator: 'arrow',
		},
	},
);

export type AccordionItemProps = ComponentPropsWithRef<typeof BaseAccordion.Item> &
	VariantProps<typeof accordionItemVariants>;

export function AccordionItem({ className, indicator, ...props }: AccordionItemProps) {
	return (
		<BaseAccordion.Item
			data-slot='accordion-item'
			className={cn(accordionItemVariants({ indicator }), className)}
			{...props}
		/>
	);
}

export type AccordionTriggerProps = ComponentPropsWithRef<typeof BaseAccordion.Trigger>;

export function AccordionTrigger({ className, ...props }: AccordionTriggerProps) {
	return (
		<BaseAccordion.Header className='contents'>
			<BaseAccordion.Trigger
				data-slot='accordion-trigger'
				className={cn('collapse-title w-full text-left font-medium outline-none', className)}
				{...props}
			/>
		</BaseAccordion.Header>
	);
}

export type AccordionContentProps = ComponentPropsWithRef<typeof BaseAccordion.Panel>;

export function AccordionContent({ className, ...props }: AccordionContentProps) {
	return <BaseAccordion.Panel data-slot='accordion-content' className={cn('collapse-content', className)} {...props} />;
}

export const AccordionCompound = {
	Root: Accordion,
	Item: AccordionItem,
	Trigger: AccordionTrigger,
	Content: AccordionContent,
};
