/** Small finite-number predicates and fallback coercions shared by layout and snapshot validation. */
export function isFiniteNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
export function isFiniteNonNegative(value: unknown): value is number { return isFiniteNumber(value) && value >= 0; }
export function isFinitePositive(value: unknown): value is number { return isFiniteNumber(value) && value > 0; }
export function finitePositive(value: number | undefined, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback; }
export function finiteNumber(value: number | undefined, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
export function finiteNonNegative(value: number | undefined, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback; }
