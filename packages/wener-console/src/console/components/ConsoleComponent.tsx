import type React from 'react';
import type { ComponentPropsWithoutRef, ComponentPropsWithRef, ErrorInfo, ReactNode } from 'react';
import { GrSystem } from 'react-icons/gr';
import { defineComponent, type ContextComponentType } from '../../components/ComponentProvider';
import { LoadingIndicator as _LoadingIndicator } from '../../loader';
import { ErrorSuspenseBoundary as _ErrorSuspenseBoundary, Image as _Image, Link as _Link } from '../../web';
import { EmptyPlaceholder as _EmptyPlaceholder } from '../../web/formats/EmptyPlaceholder';

enum ConsoleComponentName {
  SiteLogo = 'SiteLogo',
  LoadingIndicator = 'LoadingIndicator',
  EmptyPlaceholder = 'EmptyPlaceholder',
  ErrorSuspenseBoundary = 'ErrorSuspenseBoundary',
  Image = 'Image',
  Link = 'Link',
}

export type SiteLogoProps = ComponentPropsWithoutRef<'svg'>;
type SiteLogo = ContextComponentType<SiteLogoProps>;
export const SiteLogo = defineComponent<SiteLogoProps>({
  name: ConsoleComponentName.SiteLogo,
  Component: GrSystem,
});

export type LoadingIndicatorProps = ComponentPropsWithoutRef<'div'> & {
  title?: ReactNode;
  error?: Error;
};

type LoadingIndicator = ContextComponentType<LoadingIndicatorProps>;
export const LoadingIndicator = defineComponent<LoadingIndicatorProps>({
  name: ConsoleComponentName.LoadingIndicator,
  Component: _LoadingIndicator,
});

export type EmptyPlaceholderProps<E extends React.ElementType> = Omit<React.ComponentPropsWithoutRef<E>, 'as'> & {
  as?: E;
  children?: React.ReactNode;
};
type EmptyPlaceholder<E extends React.ElementType = 'div'> = ContextComponentType<EmptyPlaceholderProps<E>>;
export const EmptyPlaceholder = defineComponent({
  name: ConsoleComponentName.EmptyPlaceholder,
  Component: _EmptyPlaceholder,
});

export type ErrorSuspenseBoundaryProps = {
  fallback?: ReactNode;
  children: ReactNode;
  title?: ReactNode;
  onError?: (e: { error: Error; errorInfo: ErrorInfo }) => void;
};
type ErrorSuspenseBoundary = ContextComponentType<ErrorSuspenseBoundaryProps>;
export const ErrorSuspenseBoundary = defineComponent<ErrorSuspenseBoundaryProps>({
  name: ConsoleComponentName.ErrorSuspenseBoundary,
  Component: _ErrorSuspenseBoundary,
});

export type ImageProps = ComponentPropsWithRef<'img'>;
export const Image = defineComponent({
  name: ConsoleComponentName.Image,
  Component: _Image,
});

export type LinkProps<E extends React.ElementType = 'a'> = Omit<ComponentPropsWithRef<E>, 'href'> & {
  as?: E;
  href: string;
};
type Link<E extends React.ElementType = 'a'> = ContextComponentType<LinkProps<E>>;
export const Link = defineComponent<LinkProps>({
  name: ConsoleComponentName.Link,
  Component: _Link,
});

export const ConsoleComponent = {
  SiteLogo,
  LoadingIndicator,
  EmptyPlaceholder,
  ErrorSuspenseBoundary,
  Image,
  Link,
} as const;
