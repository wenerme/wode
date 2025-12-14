import React, { cloneElement, isValidElement, type ElementType, type ReactElement, type ReactNode } from 'react';
import { cn } from '../utils/cn';

type RegionElementProps = { className?: string; children?: ReactNode };

export type LayoutRegion =
	| ReactNode
	| { content: ReactNode; className?: string; as?: ElementType | ReactElement<RegionElementProps> };

export function renderRegion(region?: LayoutRegion) {
	if (!region) return null;
	if (!(typeof region === 'object' && 'content' in region)) {
		return region;
	}
	const { className, content, as: As = 'div' } = region;

	// 支持传入 ReactElement 作为容器，类似 render prop
	if (isValidElement<RegionElementProps>(As)) {
		return cloneElement(As, {
			className: cn(As.props.className, className),
			children: content,
		});
	}

	return <As className={cn(className)}>{content}</As>;
}
