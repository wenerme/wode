export type IntentType = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
export type SizeType = 'lg' | 'md' | 'sm' | 'xs';

const Sizes = ['lg', 'md', 'sm', 'xs'] as const;
const Intents = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'] as const;

export interface DaisyModifierProps {
  outline?: boolean;
  square?: boolean;
  circle?: boolean;
  fill?: boolean;
  bordered?: boolean;
  ghost?: boolean;
  wide?: boolean;
  block?: boolean;
  intent?: IntentType;
  size?: SizeType;
}

// export const DaisyModifiers = [
//   'outline',
//   'square',
//   'circle',
//   'fill',
//   'bordered',
//   'ghost',
//   'wide',
//   'block',
//   'intent',
//   'size',
// ] as const;

// type DaisyModifierKey = keyof DaisyModifierProps;
//
// function omitDaisyModifiers<I extends object, K extends DaisyModifierKey>(
//   o: I,
//   keys: ReadonlyArray<K> = DaisyModifiers as any,
// ): Omit<I, K> {
//   return omit(o, ...keys) as any;
// }

// function omit(obj: any, ...keys: string[]) {
//   return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k as any)));
// }

export function daisyProps<P extends DaisyModifierProps & { className?: string }>(
  name: string,
  { ghost, circle, square, bordered, fill, size, outline, intent, className, ...rest }: P,
  props: { className?: string } = {},
): { className: string } & Omit<P, keyof DaisyModifierProps> {
  const cx = [
    name,
    bordered && `${name}-bordered`,
    ghost && `${name}-ghost`,
    circle && `${name}-circle`,
    square && `${name}-square`,
    fill && `${name}-fill`,
    size && `${name}-${size}`,
    outline && `${name}-outline`,
    intent && `${name}-${intent}`,
    props.className,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return {
    ...rest,
    className: cx,
  } as any;
}

export function daisy(
  name: string,
  { ghost, circle, square, bordered, fill, size, outline, intent }: DaisyModifierProps,
) {
  return [
    name,
    bordered && `${name}-bordered`,
    ghost && `${name}-ghost`,
    circle && `${name}-circle`,
    square && `${name}-square`,
    fill && `${name}-fill`,
    size && `${name}-${size}`,
    outline && `${name}-outline`,
    intent && `${name}-${intent}`,
  ]
    .filter(Boolean)
    .join(' ');
}
