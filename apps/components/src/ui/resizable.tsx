'use client';

import { GripVerticalIcon } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';
import { cn } from '@/lib/utils';

export function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps) {
	return (
		<ResizablePrimitive.Group
			data-slot='resizable-panel-group'
			className={cn('flex h-full w-full aria-[orientation=vertical]:flex-col', className)}
			{...props}
		/>
	);
}

export function ResizablePanel(props: ResizablePrimitive.PanelProps) {
	return <ResizablePrimitive.Panel data-slot='resizable-panel' {...props} />;
}

export function ResizableHandle({
	withHandle,
	className,
	...props
}: ResizablePrimitive.SeparatorProps & { withHandle?: boolean }) {
	return (
		<ResizablePrimitive.Separator
			data-slot='resizable-handle'
			className={cn(
				'bg-base-300 hover:bg-info/70 focus-visible:bg-info data-[separator=hover]:bg-info/70 data-[separator=active]:bg-info focus-visible:ring-info relative z-10 flex w-0.5 items-center justify-center transition-colors duration-150 after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden aria-[orientation=horizontal]:h-0.5 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-2 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90',
				className,
			)}
			{...props}
		>
			{withHandle ? (
				<div className='bg-base-300 z-10 flex h-4 w-3 items-center justify-center rounded-xs border'>
					<GripVerticalIcon aria-hidden='true' className='size-2.5' />
				</div>
			) : null}
		</ResizablePrimitive.Separator>
	);
}
