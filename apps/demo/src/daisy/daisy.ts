export type IntentType = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
export type SizeType = 'lg' | 'md' | 'sm' | 'xs';

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

export const DaisyModifiers = [
  'outline',
  'square',
  'circle',
  'fill',
  'bordered',
  'ghost',
  'wide',
  'block',
  'intent',
  'size',
] as const;
type DaisyModifierKey = keyof DaisyModifierProps;

export function omitDaisyModifiers<I extends object, K extends DaisyModifierKey>(
  o: I,
  keys: ReadonlyArray<K> = DaisyModifiers as any,
): Omit<I, K> {
  return omit(o, ...keys) as any;
}

export function omit(obj: any, ...keys: string[]) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k as any)));
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
