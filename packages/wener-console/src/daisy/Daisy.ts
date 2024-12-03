export namespace Daisy {
  type SemanticColorType = 'info' | 'success' | 'warning' | 'error';
  type ThemeColorType = 'primary' | 'secondary' | 'accent';
  type StatusModifierType = 'active' | 'disabled' | 'readonly' | 'loading' | 'open';
  type AlignType = 'start' | 'center' | 'end';
  type PositionType = 'top' | 'right' | 'bottom' | 'left';

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
      select: 'select-xs',
      badge: 'badge-xs',
      kbd: 'kbd-xs',
      table: 'table-xs',
      'btm-nav': 'btm-nav-xs',
      menu: 'menu-xs',
      'file-input': 'file-input-xs',
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
      select: 'select-sm',
      badge: 'badge-sm',
      kbd: 'kbd-sm',
      table: 'table-sm',
      'btm-nav': 'btm-nav-sm',
      menu: 'menu-sm',
      'file-input': 'file-input-sm',
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
      select: 'select-md',
      badge: 'badge-md',
      kbd: 'kbd-md',
      table: 'table-md',
      'btm-nav': 'btm-nav-md',
      menu: 'menu-md',
      'file-input': 'file-input-md',
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
      badge: 'badge-lg',
      select: 'select-lg',
      kbd: 'kbd-lg',
      table: 'table-lg',
      'btm-nav': 'btm-nav-lg',
      menu: 'menu-lg',
      'file-input': 'file-input-lg',
      value: 64,
    },
  };

  export type SizeType = 'xs' | 'sm' | 'md' | 'lg';

  type ComponentType =
    | 'btn'
    | 'input'
    | 'textarea'
    | 'checkbox'
    | 'tabs'
    | 'select'
    | 'badge'
    | 'kbd'
    | 'table'
    | 'btm-nav'
    | 'menu'
    | 'file-input';

  // radio range rating toggle

  export function getSize(size?: SizeType) {
    return size ? Sizes[size] : undefined;
  }

  function sizeOf(type: ComponentType, size: SizeType = 'md') {
    return size ? Sizes[size][type] : undefined;
  }
}

type ComponentDef = {
  name: string;
  size?: boolean;
  semanticColor?: boolean;
  themeColor?: boolean;
  modifiers?: string[];
};

const Components: ComponentDef[] = [
  {
    name: 'button',
    size: true,
    semanticColor: true,
    themeColor: true,
  },
];
