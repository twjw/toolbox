/** @description 兩個 union type 取交集 */
export type UnionIntersection<T, U> = T extends U ? T : never

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
    k: infer I,
  ) => void
  ? I
  : never

type LastOf<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R
  ? R
  : never

type Push<T extends any[], V> = [...T, V]

/** @description union 變成 tuple */
export type UnionToTuple<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N
  ? []
  : Push<UnionToTuple<Exclude<T, L>>, L>

/** @description 物件key轉成 union string
 * @example RecursiveKeyOf<{a: {b: string}, c: number}> -> 'a.b' | 'c' */
export type RecursiveKeyOf<Obj extends object, Sep extends string = '.'> = {
  [K in keyof Obj & (string | number)]: Obj[K] extends object
    ? `${K}` | `${K}${Sep}${RecursiveKeyOf<Obj[K]>}`
    : `${K}`
}[keyof Obj & (string | number)]

/** @description 移除 key 前綴(Prefix 2參) */
export type IgnoreKeyPrefix<Obj extends object, Prefix extends string = '_'> = {
  [K in keyof Obj as K extends `${Prefix}${infer Rest}` ? Rest : K]: Obj[K] extends object
    ? IgnoreKeyPrefix<Obj[K], Prefix>
    : Obj[K]
}

/** @description 深可選 */
export type DeepPartial<Obj extends Record<string, any>> = {
  [K in keyof Obj]?: Obj[K] extends Record<string, any> ? DeepPartial<Obj[K]> : Obj[K]
}

type BetterPickKey<
  T extends Record<string | number, any>,
  K = (keyof T & string | number) | `${keyof T & string | number}->${string}`
> =
  K | `?${K & string | number}`

/** @description TS 自帶的 Pick 加強版，支持更名與轉可選
 * @example BetterPick<{a: 1, b: 2, c: 3, d: 4}, 'a' | '?b' | 'c->c2' | '?d->d2'> -> {a: 1, b?: 2, c2: 3, d2?: 4} */
export type BetterPick<
  T extends Record<string | number, any>,
  K extends BetterPickKey<T>
> = {
  // 必填
  [
    P in (
      K extends `${infer PS}${infer K1}->${string}`
        ? PS extends '?'
          ? never
          : `${PS}${K1}`
        : K extends `?${string}`
          ? never
          : K
      ) as
      K extends `?${P & string | number}->${infer K2}`
        ? K2
        : P
  ]: T[P]
}
// 非必填
& {
  [
    P in (
      K extends `${infer PS}${infer K1}->${string}`
        ? PS extends '?'
          ? K1
          : never
        : K extends `?${infer K1}`
          ? K1
          : never
      ) as
      K extends `?${P & string | number}->${infer K2}`
        ? K2
        : P
  ]?: T[P]
}

/** @description 首字串變大寫 */
export type FirstUppercase<Str extends string> = Str extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : never
