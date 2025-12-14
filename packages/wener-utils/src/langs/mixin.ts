import type { Constructor } from '../types';

/**
 * Mixin function type - takes a base class and returns an extended class
 */
export type MixinFn<TBase extends Constructor = Constructor, TResult extends TBase = TBase> = (Base: TBase) => TResult;

export function mixin<T extends Constructor>(Base: T): T;
export function mixin<T extends Constructor, M1 extends MixinFn<T>>(Base: T, m1: M1): ReturnType<M1>;
export function mixin<T extends Constructor, M1 extends MixinFn<T>, M2 extends MixinFn<ReturnType<M1>>>(
	Base: T,
	m1: M1,
	m2: M2,
): ReturnType<M2>;
export function mixin<
	T extends Constructor,
	M1 extends MixinFn<T>,
	M2 extends MixinFn<ReturnType<M1>>,
	M3 extends MixinFn<ReturnType<M2>>,
>(Base: T, m1: M1, m2: M2, m3: M3): ReturnType<M3>;
export function mixin<
	T extends Constructor,
	M1 extends MixinFn<T>,
	M2 extends MixinFn<ReturnType<M1>>,
	M3 extends MixinFn<ReturnType<M2>>,
	M4 extends MixinFn<ReturnType<M3>>,
>(Base: T, m1: M1, m2: M2, m3: M3, m4: M4): ReturnType<M4>;
export function mixin<
	T extends Constructor,
	M1 extends MixinFn<T>,
	M2 extends MixinFn<ReturnType<M1>>,
	M3 extends MixinFn<ReturnType<M2>>,
	M4 extends MixinFn<ReturnType<M3>>,
	M5 extends MixinFn<ReturnType<M4>>,
>(Base: T, m1: M1, m2: M2, m3: M3, m4: M4, m5: M5): ReturnType<M5>;
export function mixin<
	T extends Constructor,
	M1 extends MixinFn<T>,
	M2 extends MixinFn<ReturnType<M1>>,
	M3 extends MixinFn<ReturnType<M2>>,
	M4 extends MixinFn<ReturnType<M3>>,
	M5 extends MixinFn<ReturnType<M4>>,
	M6 extends MixinFn<ReturnType<M5>>,
>(Base: T, m1: M1, m2: M2, m3: M3, m4: M4, m5: M5, m6: M6): ReturnType<M6>;

/**
 * Applies the given mixins to a common base class.
 *
 * @param Base The base class to apply the mixins to.
 * @param mixins The mixins to apply sequentially.
 * @returns A class constructor with all mixins applied.
 *
 * @example
 * ```ts
 * class Dog extends mixin(Animal, FourLegged, Carnivore) {}
 * ```
 */
export function mixin<T extends Constructor>(Base: T, ...mixins: MixinFn<any>[]): Constructor {
	return mixins.reduce((mix, applyMixin) => applyMixin(mix), Base as Constructor);
}
