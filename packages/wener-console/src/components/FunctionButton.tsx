import type React from 'react';
import { forwardRef, useState, type ComponentPropsWithoutRef, type ComponentPropsWithRef, type FC } from 'react';
import { HiExclamationCircle } from 'react-icons/hi2';
import {
  PiArrowsCounterClockwiseLight,
  PiArrowSquareOutLight,
  PiTrashSimpleLight,
  PiUserPlusLight,
} from 'react-icons/pi';
import { Slot } from '@radix-ui/react-slot';
import { flexRender, useDebounce, type FlexRenderable } from '@wener/reaction';
import type { MaybePromise } from '@wener/utils';
import { clsx } from 'clsx';
import { Daisy } from '../daisy';
import { showErrorToast } from '../toast';
import { cn } from '../tw';

export namespace FunctionButton {
  export type RefreshButtonProps = ComponentPropsWithoutRef<'button'> & {
    onRefresh?: (e?: React.MouseEvent) => void;
    loading?: boolean;
    error?: any;
    size?: Daisy.SizeType;
  };

  export const Refresh: React.FC<RefreshButtonProps> = ({
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

  export type SubmitButtonProps = ComponentPropsWithoutRef<'button'> & {
    size?: Daisy.SizeType;
    asChild?: boolean;
    loading?: boolean;
  };

  export const Submit: React.FC<SubmitButtonProps> = ({ children = <>提交</>, loading, ...props }) => {
    const sz = Daisy.getSize(props.size);
    return (
      <Button type={'submit'} {...props}>
        {loading && <div className={cn('loading loading-spinner', sz?.loading)}></div>}
        {children}
      </Button>
    );
  };

  export type PopupButtonProps = ButtonProps & {
    onPopup?: (e: React.MouseEvent) => void;
  };

  export const Popup: React.FC<PopupButtonProps> = ({ onPopup, children, className, ...props }) => {
    return (
      <Button {...props} className={cn(!children && 'btn-square', className)} onClick={onPopup}>
        {children ?? <PiArrowSquareOutLight />}
      </Button>
    );
  };

  export type DeleteButtonProps = ButtonProps & {
    onDelete?: () => void;
  };
  export const Delete: React.FC<DeleteButtonProps> = ({ onDelete, children, className, ...props }) => {
    /*
    <button
                        type={'button'}
                        className={'btn btn-square btn-error btn-sm'}
                        onClick={() => {
                          showResourceDeleteAlterDialog({
                            schema,
                            data: res,
                            onSubmit: refresh,
                          });
                        }}
                      >
                        <PiTrashSimpleLight />
                      </button>
     */
    return (
      <Button {...props} icon={PiTrashSimpleLight} className={cn('btn-error', className)} onAction={onDelete}>
        {children}
      </Button>
    );
  };

  export const BindCustomer = forwardRef<HTMLButtonElement, ButtonProps>(({ children, className, ...props }, ref) => {
    return (
      <Button {...props} className={cn(!children && 'btn-square', className)} ref={ref}>
        {children ?? <PiUserPlusLight />}
      </Button>
    );
  });

  export const BindUser: FC<ButtonProps> = ({ children, className, ...props }) => {
    return (
      <Button {...props} className={cn(!children && 'btn-square', className)}>
        {children ?? <PiUserPlusLight />}
      </Button>
    );
  };

  export type ButtonProps = ComponentPropsWithRef<'button'> & {
    size?: Daisy.SizeType;
    asChild?: boolean;
    onAction?: (e: React.MouseEvent) => MaybePromise<any>;
    icon?: FlexRenderable<any>;
    text?: React.ReactNode;
    loading?: boolean;
  };

  export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ size, children, asChild, className, onAction, onClick, icon, text, loading, ...props }, ref) => {
      const sz = Daisy.getSize(size);
      const [_loading, setLoading] = useState(false);
      loading ||= _loading;

      const Comp = asChild ? Slot : 'button';
      if (!onClick && onAction) {
        onClick = (e: React.MouseEvent) => {
          if (loading) {
            return;
          }
          const p = onAction(e);
          if (p && p.then) {
            setLoading(true);
            p.then(() => {
              setLoading(false);
            }).catch((e: any) => {
              setLoading(false);
              // 不一定是直接处理error
              // showErrorToast(e);
            });
          }
        };
      }
      let square = false;
      if (!children) {
        let _icon;
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
      return (
        <Comp
          type={'button'}
          className={cn('btn', sz?.btn, square && 'btn-square', className)}
          ref={ref}
          {...{
            ...props,
            onClick,
          }}
        >
          {children}
        </Comp>
      );
    },
  );
}
