import { Separator, type SeparatorProps } from 'react-resizable-panels';
import { cn } from '@wener/console';
import styles from './PanelResizeLineHandle.module.css';

export function PanelResizeLineHandle({ className, ...props }: SeparatorProps) {
	return <Separator className={cn(styles.PanelResizeLineHandle, className)} {...props} />;
}
