import React, { type ElementType, type ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../tw';

export type LayoutRegion = ReactNode | { content: ReactNode; className?: string; asChild?: boolean; as?: ElementType };
export function renderRegion(region?: LayoutRegion) {
  if (!region) return null;
  if (!(typeof region === 'object' && 'content' in region)) {
    return region;
  }
  let { className, content, as: As = 'div', asChild } = region;
  if (As) {
    As = Slot as ElementType;
  }
  return <As className={cn(className)}>{content}</As>;
}
