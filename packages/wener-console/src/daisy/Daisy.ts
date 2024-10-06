export namespace Daisy {
  const Sizes: Record<
    SizeType,
    {
      [key in ComponentType | 'size' | 'loading' | 'icon']: string;
    } & {
      [key in 'value']: number;
    }
  > = {
    xs: {
      btn: 'btn-xs',
      loading: 'loading-xs',
      input: 'input-xs',
      textarea: 'textarea-xs',
      size: 'size-6',
      checkbox: 'checkbox-xs',
      tabs: 'tabs-xs',
      icon: 'size-4',
      value: 24,
    },
    sm: {
      btn: 'btn-sm',
      loading: 'loading-xs',
      input: 'input-sm',
      textarea: 'textarea-sm',
      checkbox: 'checkbox-sm',
      size: 'size-8',
      tabs: 'tabs-sm',
      icon: 'size-6',
      value: 32,
    },
    md: {
      btn: 'btn-md',
      loading: 'loading',
      input: 'input-md',
      textarea: 'textarea-md',
      checkbox: 'checkbox-md',
      size: 'size-12',
      tabs: 'tabs-md',
      icon: 'size-8',
      value: 48,
    },
    lg: {
      btn: 'btn-lg',
      loading: 'loading-lg',
      input: 'input-lg',
      textarea: 'textarea-lg',
      checkbox: 'checkbox-lg',
      size: 'size-16',
      tabs: 'tabs-lg',
      icon: 'size-12',
      value: 64,
    },
  };

  export type SizeType = 'xs' | 'sm' | 'md' | 'lg';

  type ComponentType = 'btn' | 'input' | 'textarea' | 'checkbox' | 'tabs';

  export function getSize(size?: SizeType) {
    return size ? Sizes[size] : undefined;
  }
}
