import type { ManagedWindow } from './WindowManagerTypes';
const WINDOW_MANAGER_WINDOW_RECORD = Symbol('WindowManagerWindowRecord');
export type WindowManagerWindowRecord = Record<string, ManagedWindow> & { [WINDOW_MANAGER_WINDOW_RECORD]?: true };
export function createWindowManagerWindowRecord(): WindowManagerWindowRecord { const value = Object.create(null) as WindowManagerWindowRecord; Object.defineProperty(value, WINDOW_MANAGER_WINDOW_RECORD, { value: true }); return value; }
export function isWindowManagerWindowRecord(value: unknown): value is WindowManagerWindowRecord & { [WINDOW_MANAGER_WINDOW_RECORD]: true } { return Boolean(value && typeof value === 'object' && Object.getPrototypeOf(value) === null && Reflect.get(value, WINDOW_MANAGER_WINDOW_RECORD) === true); }
export function cloneNullPrototypeRecord(value: Record<PropertyKey, unknown>): WindowManagerWindowRecord {
	const copy = createWindowManagerWindowRecord() as Record<PropertyKey, unknown>;
	for (const key of Reflect.ownKeys(value)) {
		if (key === WINDOW_MANAGER_WINDOW_RECORD) continue;
		const item = value[key];
		copy[key] = isManagedWindowRecordValue(item) ? { ...item, bounds: { ...item.bounds }, capabilities: { ...item.capabilities }, size: { ...item.size } } : item;
	}
	return copy as WindowManagerWindowRecord;
}
function isPlainObject(value: unknown): value is Record<string, unknown> { if (!value || typeof value !== 'object') return false; const prototype = Object.getPrototypeOf(value); return prototype === Object.prototype || prototype === null; }
function isManagedWindowRecordValue(value: unknown): value is ManagedWindow { return isPlainObject(value) && typeof value.id === 'string' && typeof value.title === 'string' && isPlainObject(value.bounds) && isPlainObject(value.capabilities) && isPlainObject(value.size); }
