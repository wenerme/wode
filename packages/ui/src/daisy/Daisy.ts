export const daisyColors = [
	'neutral',
	'primary',
	'secondary',
	'accent',
	'info',
	'success',
	'warning',
	'error',
] as const;

export type DaisyColor = (typeof daisyColors)[number];

export const daisySizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export type DaisySize = (typeof daisySizes)[number];

export type DaisyStyle = 'default' | 'outline' | 'dash' | 'soft' | 'ghost';
export type DaisyOrientation = 'horizontal' | 'vertical';
export type DaisyPlacement = 'start' | 'center' | 'end';

export type DaisyVariantProps = {
	tone?: DaisyColor | null;
	size?: DaisySize | null;
};
