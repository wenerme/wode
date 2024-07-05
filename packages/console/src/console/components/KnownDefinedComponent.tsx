import { GrSystem } from 'react-icons/gr';
import { defineComponent } from '@/components/ComponentRegistry';
import { LoadingIndicator as _LoadingIndicator } from '@/loader';
import { EmptyPlaceholder as _EmptyPlaceholder } from '../../web/formats/EmptyPlaceholder';

export enum KnownDefinedComponent {
  SiteLogo = 'SiteLogo',
  LoadingIndicator = 'LoadingIndicator',
  EmptyPlaceholder = 'EmptyPlaceholder',
}

export const SiteLogo = defineComponent({
  name: KnownDefinedComponent.SiteLogo,
  Component: GrSystem,
});
export const LoadingIndicator = defineComponent({
  name: KnownDefinedComponent.LoadingIndicator,
  Component: _LoadingIndicator,
});
export const EmptyPlaceholder = defineComponent({
  name: KnownDefinedComponent.EmptyPlaceholder,
  Component: _EmptyPlaceholder,
});
