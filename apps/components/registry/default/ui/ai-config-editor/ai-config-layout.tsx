import type { ComponentPropsWithRef, ReactNode } from 'react';

export type AiConfigFieldGridProps = ComponentPropsWithRef<'div'>;

export function AiConfigFieldGrid({ className, ...props }: AiConfigFieldGridProps) {
	return <div className={`grid min-w-0 gap-4 md:grid-cols-2 ${className ?? ''}`} {...props} />;
}

export type AiConfigFormSectionProps = ComponentPropsWithRef<'section'> & {
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
};

export function AiConfigFormSection({
	title,
	description,
	actions,
	children,
	className,
	...props
}: AiConfigFormSectionProps) {
	return (
		<section
			className={`border-base-300 min-w-0 border-b pb-6 last:border-b-0 last:pb-0 ${className ?? ''}`}
			{...props}
		>
			<header className='mb-4 flex min-w-0 flex-wrap items-start justify-between gap-2'>
				<div className='min-w-0'>
					<h3 className='text-sm font-semibold'>{title}</h3>
					{description ? <div className='text-base-content/60 mt-0.5 text-xs'>{description}</div> : null}
				</div>
				{actions ? <div className='flex shrink-0 items-center gap-1'>{actions}</div> : null}
			</header>
			{children}
		</section>
	);
}
