/**
 * Helper type to convert a union to an intersection.
 *
 * @internal
 */
type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;

/**
 * Constructor function, that creates a new instance of the given type.
 *
 * @typeParam T The type of the instance to create.
 * @example ```ts
 * function Walkable<TBase extends MixinConstructor<Positionable>>(Base: TBase) {
 * ··return class Walkable extends Base {
 * ····public forward() { this.x++; }
 * ····public backward() { this.x--; }
 * ··};
 * }
 * ```
 * @example ```ts
 * function Loggable(Base: MixinConstructor) {
 * ··return class Loggable extends Base {
 * ····public log(message: string) { throw new Error(404); }
 * ··};
 * }
 * ```
 */
export type MixinConstructor<T = {}> = new (...args: any[]) => T;

/**
 * Function that applies a mixin to a given base class.
 *
 * @typeParam T The type of the base class.
 * @typeParam R The type of the returned class.
 */
export type MixinFunction<T extends MixinConstructor = MixinConstructor, R extends T = T & MixinConstructor> = (
  Base: T,
) => R;

/**
 * The return type of the mixin function.
 *
 * @typeParam T The type of the base class.
 * @typeParam M The type of the mixin functions.
 */
export type MixinReturnValue<T extends MixinConstructor, M extends MixinFunction<T, any>[]> = UnionToIntersection<
  | T
  | {
      [K in keyof M]: M[K] extends MixinFunction<any, infer U> ? U : never;
    }[number]
>;

/**
 * The instance created by a mixin function.
 *
 * @typeParam F The type of the mixin function.
 */
export type MixinInstance<F extends MixinFunction<any>> =
  F extends MixinFunction<MixinConstructor<any>, infer R> ? InstanceType<R> : never;

/**
 * Applies the given mixins to the a common base class.
 *
 * @param Base The base class to apply the mixins to.
 * @param mixins The mixins to apply. All mixins must extend a common base class or an empty class.
 * @returns A class constructor with all mixins applied.
 *
 * @typeParam T The type of the base class.
 * @typeParam M The type of the mixin functions.
 *
 * @example ```ts
 * class Dog extends mixin(Animal, FourLegged, Carnivore, PackHunting, Barking, Domesticated) {}
 * ```
 */
export function mixin<T extends MixinConstructor, M extends MixinFunction<T, any>[]>(
  Base: T,
  ...mixins: M
): MixinReturnValue<T, M> {
  return mixins.reduce((mix, applyMixin) => applyMixin(mix), Base) as MixinReturnValue<T, M>;
}

// https://github.com/1nVitr0/lib-ts-mixin-extended
