import { z } from 'zod';

export const ConfigIdentitySchema = z.string().min(1);
export const ConfigStringMapSchema = z.record(z.string(), z.string());
export const ConfigJsonValueSchema = z.json();
export const ConfigValueMapSchema = z.record(z.string(), ConfigJsonValueSchema);
export const ConfigExtensionsSchema = ConfigValueMapSchema;
export const ConfigLabelsSchema = ConfigStringMapSchema;
export const ConfigTagsSchema = z.array(z.string().min(1));
export const ConfigUrlSchema = z.string().min(1);

export type EnabledCompatibility = {
	enabled?: boolean;
	disabled?: boolean;
};

export function enabledCompatibilityError(value: EnabledCompatibility): string | undefined {
	if (value.enabled === undefined || value.disabled === undefined) return undefined;
	if (value.enabled === !value.disabled) return undefined;
	return 'enabled and disabled must describe the same state';
}

export function isConfigEnabled(value: EnabledCompatibility): boolean {
	return value.enabled ?? !(value.disabled ?? false);
}

export function preferCanonical<T>(canonical: T | undefined, compatibility: T | undefined): T | undefined {
	return canonical !== undefined ? canonical : compatibility;
}
