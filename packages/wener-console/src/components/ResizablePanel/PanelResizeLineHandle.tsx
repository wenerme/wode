import React from 'react';
import { PanelResizeHandle as PanelResizeHandleImpl, type PanelResizeHandleProps } from 'react-resizable-panels';
import { cn } from '@wener/console';
import styles from './PanelResizeLineHandle.module.css';

export function PanelResizeLineHandle({ className, ...props }: PanelResizeHandleProps) {
	return <PanelResizeHandleImpl className={cn(styles.PanelResizeLineHandle, className)} {...props} />;
}
