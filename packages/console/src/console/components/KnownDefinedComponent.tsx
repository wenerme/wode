import React, { ComponentPropsWithoutRef, ComponentPropsWithRef, ErrorInfo, type ReactNode } from 'react';
import { GrSystem } from 'react-icons/gr';
import { ContextComponentType, defineComponent } from '@/components/ComponentProvider';
import { LoadingIndicator as _LoadingIndicator } from '@/loader';
import { ErrorSuspenseBoundary as _ErrorSuspenseBoundary } from '@/web';
import { EmptyPlaceholder as _EmptyPlaceholder } from '../../web/formats/EmptyPlaceholder';

export enum KnownDefinedComponent {
  SiteLogo = 'SiteLogo',
  LoadingIndicator = 'LoadingIndicator',
  EmptyPlaceholder = 'EmptyPlaceholder',
  ErrorSuspenseBoundary = 'ErrorSuspenseBoundary',
}

type SiteLogo = ContextComponentType<ComponentPropsWithRef<'div'>>;
export const SiteLogo = defineComponent<ComponentPropsWithoutRef<'svg'>>({
  name: KnownDefinedComponent.SiteLogo,
  Component: GrSystem,
});

type LoadingIndicator = ContextComponentType<ComponentPropsWithoutRef<'div'>>;
export const LoadingIndicator = defineComponent({
  name: KnownDefinedComponent.LoadingIndicator,
  Component: _LoadingIndicator,
});

type EmptyPlaceholder<E extends React.ElementType = 'div'> = ContextComponentType<EmptyPlaceholderProps<E>>;
export const EmptyPlaceholder = defineComponent({
  name: KnownDefinedComponent.EmptyPlaceholder,
  Component: _EmptyPlaceholder,
});

export type EmptyPlaceholderProps<E extends React.ElementType> = Omit<React.ComponentPropsWithoutRef<E>, 'as'> & {
  as?: E;
  children?: React.ReactNode;
};

export type ErrorSuspenseBoundaryProps = {
  fallback?: ReactNode;
  children: ReactNode;
  title?: ReactNode;
  onError?: (e: { error: Error; errorInfo: ErrorInfo }) => void;
};
type ErrorSuspenseBoundary = ContextComponentType<ErrorSuspenseBoundaryProps>;
export const ErrorSuspenseBoundary = defineComponent<ErrorSuspenseBoundaryProps>({
  name: KnownDefinedComponent.ErrorSuspenseBoundary,
  Component: _ErrorSuspenseBoundary,
});
