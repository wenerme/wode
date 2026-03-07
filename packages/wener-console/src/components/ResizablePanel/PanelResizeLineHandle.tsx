import { cn } from '@wener/console';
import { Separator, type SeparatorProps } from 'react-resizable-panels';
import styles from './PanelResizeLineHandle.module.css';

export function PanelResizeLineHandle({ className, ...props }: SeparatorProps) {
	return <Separator className={cn(styles.PanelResizeLineHandle, className)} {...props} />;
}
