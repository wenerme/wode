'use client';

import type { FieldError, FieldErrors, FieldValues, UseFormReturn } from 'react-hook-form';

export type FieldErrorItem = {
	path: string;
	error: FieldError;
	message: string;
	type?: string;
};

export type FormatFieldErrorsOptions = {
	fallback?: string;
	includePath?: boolean;
	separator?: string;
};

const missing = Symbol('missing dirty value');

export function getFieldErrors(errors: FieldErrors | undefined, rootPath = ''): FieldErrorItem[] {
	const output: FieldErrorItem[] = [];
	collectFieldErrors(errors, rootPath, output);
	return output;
}

export function formatFieldErrors(
	errors: FieldErrors | undefined,
	{ fallback = 'Form validation failed', includePath = true, separator = '; ' }: FormatFieldErrorsOptions = {},
) {
	const messages = getFieldErrors(errors).map(({ path, message }) => {
		if (!includePath || !path) return message;
		return `${path}: ${message}`;
	});
	return messages.length ? messages.join(separator) : fallback;
}

export function getDirtyValues<TFieldValues extends FieldValues>(
	form: Pick<UseFormReturn<TFieldValues>, 'formState' | 'getValues'>,
): Partial<TFieldValues> {
	return getDirtyFieldValues(form.formState.dirtyFields, form.getValues()) as Partial<TFieldValues>;
}

export function getDirtyFieldValues(dirtyFields: unknown, values: unknown): unknown {
	const result = collectDirtyValue(dirtyFields, values);
	return result === missing ? {} : result;
}

function collectFieldErrors(value: unknown, path: string, output: FieldErrorItem[]) {
	if (!isRecord(value)) return;
	if (isFieldError(value)) {
		const error = value as FieldError;
		const message = toMessage(error.message) || toMessage(error.type) || 'Invalid value';
		output.push({
			error,
			message,
			path,
			type: typeof error.type === 'string' ? error.type : undefined,
		});
		return;
	}
	for (const [key, child] of Object.entries(value)) {
		collectFieldErrors(child, path ? `${path}.${key}` : key, output);
	}
}

function collectDirtyValue(dirty: unknown, value: unknown): unknown | typeof missing {
	if (dirty === true) return value;
	if (Array.isArray(dirty)) {
		const source = Array.isArray(value) ? value : [];
		const output: unknown[] = [];
		let hasDirty = false;
		for (const [index, childDirty] of dirty.entries()) {
			const child = collectDirtyValue(childDirty, source[index]);
			if (child !== missing) {
				output[index] = child;
				hasDirty = true;
			}
		}
		return hasDirty ? output : missing;
	}
	if (isRecord(dirty)) {
		const source = isRecord(value) ? value : {};
		const output: Record<string, unknown> = {};
		for (const [key, childDirty] of Object.entries(dirty)) {
			const child = collectDirtyValue(childDirty, source[key]);
			if (child !== missing) output[key] = child;
		}
		return Object.keys(output).length ? output : missing;
	}
	return missing;
}

function isFieldError(value: Record<string, unknown>) {
	return (
		('type' in value && typeof value.type !== 'object') ||
		('message' in value && (typeof value.message === 'string' || typeof value.message === 'number'))
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function toMessage(value: unknown) {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	return '';
}
