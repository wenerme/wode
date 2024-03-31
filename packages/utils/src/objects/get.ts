import { parseObjectPath, type ObjectKey } from './parseObjectPath';

/**
 * get by path
 *
 * {@link https://github.com/developit/dlv dlv}
 */
export function get<O extends object, P extends ObjectKey, OrElse extends unknown>(
  obj: O,
  key: P | P[],
  def?: OrElse,
): ResolveObjectPathType<O, P, OrElse> {
  const undef = undefined;
  const path = parseObjectPath(key);
  let out: any = obj;
  for (const i of path) {
    out = out ? out[i] : undef;
  }
  return out === undef ? def : out;
}

/**
 * It tries to resolve the path of the given object, otherwise it will return OrElse
 *
 * {@link https://github.com/Pouja/typescript-deep-path-safe typescript-deep-path-safe}
 */
export type ResolveObjectPathType<
  ObjectType,
  Path extends string | symbol | number,
  OrElse,
> = Path extends keyof ObjectType
  ? ObjectType[Path]
  : Path extends `${infer LeftSide}.${infer RightSide}`
    ? LeftSide extends keyof ObjectType
      ? ResolveObjectPathType<ObjectType[LeftSide], RightSide, OrElse>
      : Path extends `${infer LeftSide}[${number}].${infer RightSide}`
        ? LeftSide extends keyof ObjectType
          ? ObjectType[LeftSide] extends Array<infer U>
            ? ResolveObjectPathType<U, RightSide, OrElse>
            : OrElse
          : OrElse
        : OrElse
    : Path extends `${infer LeftSide}[${number}]`
      ? LeftSide extends keyof ObjectType
        ? ObjectType[LeftSide] extends Array<infer U>
          ? U
          : OrElse
        : OrElse
      : OrElse;
