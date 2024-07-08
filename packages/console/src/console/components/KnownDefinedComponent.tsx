import React, { ComponentPropsWithoutRef, ComponentPropsWithRef } from 'react';
import { GrSystem } from 'react-icons/gr';
import { defineComponent, RegisteredComponentType } from '@/components/ComponentProvider';
import { LoadingIndicator as _LoadingIndicator } from '@/loader';
import { EmptyPlaceholder as _EmptyPlaceholder } from '../../web/formats/EmptyPlaceholder';

export enum KnownDefinedComponent {
  SiteLogo = 'SiteLogo',
  LoadingIndicator = 'LoadingIndicator',
  EmptyPlaceholder = 'EmptyPlaceholder',
}

type SiteLogo = RegisteredComponentType<ComponentPropsWithRef<'div'>>;
export const SiteLogo = defineComponent<ComponentPropsWithoutRef<'svg'>>({
  name: KnownDefinedComponent.SiteLogo,
  Component: GrSystem,
});

type LoadingIndicator = RegisteredComponentType<ComponentPropsWithoutRef<'div'>>;
export const LoadingIndicator = defineComponent({
  name: KnownDefinedComponent.LoadingIndicator,
  Component: _LoadingIndicator,
});

type EmptyPlaceholder<E extends React.ElementType = 'div'> = RegisteredComponentType<EmptyPlaceholderProps<E>>;
export const EmptyPlaceholder = defineComponent({
  name: KnownDefinedComponent.EmptyPlaceholder,
  Component: _EmptyPlaceholder,
});

type EmptyPlaceholderProps<E extends React.ElementType> = Omit<React.ComponentPropsWithoutRef<E>, 'as'> & {
  as?: E;
  children?: React.ReactNode;
};
