import { useRender } from '@base-ui/react/use-render';
import { type FlexRenderable, flexRender, useDebounce } from '@wener/reaction';
import type { MaybePromise } from '@wener/utils';
import { clsx } from 'clsx';
import { type ComponentPropsWithoutRef, type FC, type MouseEvent, type ReactNode, useState } from 'react';
import { HiExclamationCircle } from 'react-icons/hi2';
import {
	PiArrowSquareOutLight,
	PiArrowsCounterClockwiseLight,
	PiTrashSimpleLight,
	PiUserPlusLight,
} from 'react-icons/pi';
import { Daisy } from '../daisy';
import { showErrorToast } from '../toast';
import { cn } from '../utils/cn';

export namespace FunctionButton {
	export type RefreshButtonProps = ComponentPropsWithoutRef<'button'> & {
		onRefresh?: (e?: MouseEvent) => void;
		loading?: boolean;
		error?: any;
		size?: Daisy.SizeType;
	};

	export const Refresh: FC<RefreshButtonProps> = ({
		className,
		children,
		onClick,
		onRefresh = onClick,
		loading,
		error,
		size,
		...props
	}) => {
		const _loading = useDebounce(loading, 250);
		const sz = Daisy.getSize(size);
		const btn = (
			<button
				type={'button'}
				className={cn('btn', !children && 'btn-square', error && 'join-item', sz?.btn, className)}
				onClick={(e) => {
					if (loading) {
						return;
					}
					onRefresh?.(e);
				}}
				{...props}
			>
				{!_loading && <PiArrowsCounterClockwiseLight />}
				{_loading && <div className={cn('loading loading-spinner', sz?.loading)}></div>}
				{children}
			</button>
		);
		if (error) {
			return (
				<div className={cn('join')}>
					{btn}
					<button
						type={'button'}
						className={cn('btn btn-square btn-outline btn-warning', sz?.btn, className)}
						onClick={() => {
							showErrorToast(error);
						}}
					>
						<HiExclamationCircle />
					</button>
				</div>
			);
		}
		return <>{btn}</>;
	};

	export type SubmitButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'key'> & {
		size?: Daisy.SizeType;
		loading?: boolean;
	};

	export const Submit: FC<SubmitButtonProps> = ({ children = <>提交</>, loading, ...props }) => {
		const sz = Daisy.getSize(props.size);
		return (
			<Button type={'submit'} {...props}>
				{loading && <div className={cn('loading loading-spinner', sz?.loading)}></div>}
				{children}
			</Button>
		);
	};

	export type PopupButtonProps = ButtonProps & {
		onPopup?: (e: MouseEvent) => void;
	};

	export const Popup: FC<PopupButtonProps> = ({ onPopup, children, className, ...props }) => {
		return (
			<Button {...props} className={cn(!children && 'btn-square', className)} onClick={onPopup}>
				{children ?? <PiArrowSquareOutLight />}
			</Button>
		);
	};

	export type DeleteButtonProps = ButtonProps & {
		onDelete?: () => void;
	};
	export const Delete: FC<DeleteButtonProps> = ({ onDelete, children, className, ...props }) => {
		return (
			<Button {...props} icon={PiTrashSimpleLight} className={cn('btn-error', className)} onAction={onDelete}>
				{children}
			</Button>
		);
	};

	export const BindCustomer: FC<ButtonProps> = (props) => {
		return <Button icon={PiUserPlusLight} {...props} />;
	};

	export const BindUser: FC<ButtonProps> = (props) => {
		return <Button icon={PiUserPlusLight} {...props} />;
	};

	export type ButtonProps = useRender.ComponentProps<'button'> & {
		size?: Daisy.SizeType;
		onAction?: (e: MouseEvent) => MaybePromise<any>;
		icon?: FlexRenderable<any>;
		text?: ReactNode;
		loading?: boolean;
	};

	export const Button = ({
		size,
		children,
		render,
		className,
		onAction,
		onClick,
		icon,
		text,
		loading,
		ref,
		...props
	}: ButtonProps): ReactNode => {
		const sz = Daisy.getSize(size);
		const [_loading, setLoading] = useState(false);
		loading ||= _loading;

		if (!onClick && onAction) {
			onClick = (e: MouseEvent) => {
				if (loading) {
					return;
				}
				const p = onAction(e);
				if (p?.then) {
					setLoading(true);
					p.then(() => {
						setLoading(false);
					}).catch(() => {
						setLoading(false);
						// 不一定是直接处理error
						// showErrorToast(e);
					});
				}
			};
		}
		let square = false;
		if (!children) {
			let _icon: React.ReactNode;
			square = Boolean(icon && !text);
			if (loading) {
				_icon = <div className={clsx('loading loading-spinner', sz?.loading)}></div>;
			} else {
				_icon = flexRender(icon, {
					className: sz?.icon,
				});
			}
			children = (
				<>
					{_icon}
					{text}
				</>
			);
		}

		return useRender({
			defaultTagName: 'button',
			render,
			ref,
			props: {
				type: 'button',
				className: cn('btn', sz?.btn, square && 'btn-square', className),
				'data-loading': loading || null,
				...props,
				onClick,
				children,
			},
		});
	};
}
