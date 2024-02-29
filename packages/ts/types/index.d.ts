export namespace WUni {
  // 兩個 union type 取交集
  type Intersection<T, U> = T extends U ? T : never

  // ToTuple START
  type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
      k: infer I,
    ) => void
    ? I
    : never

  type LastOf<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R
    ? R
    : never

  type Push<T extends any[], V> = [...T, V]

  type ToTuple<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N
    ? []
    : Push<ToTuple<Exclude<T, L>>, L>
  // ToTuple END

  export {
    Intersection,
    ToTuple,
  }
}

export namespace WObj {
  type RecursiveKeyOf<Obj extends object, Sep extends string = '.'> = {
    [K in keyof Obj & (string | number)]: Obj[K] extends object
      ? `${K}` | `${K}${Sep}${RecursiveKeyOf<Obj[K]>}`
      : `${K}`
  }[keyof Obj & (string | number)]

  type IgnoreKeyPrefix<Obj extends object, Prefix extends string = '_'> = {
    [K in keyof Obj as K extends `${Prefix}${infer Rest}` ? Rest : K]: Obj[K] extends object
      ? IgnoreKeyPrefix<Obj[K], Prefix>
      : Obj[K]
  }

  type DeepPartial<Obj extends Record<string, any>> = {
    [K in keyof Obj]?: Obj[K] extends Record<string, any> ? DeepPartial<Obj[K]> : Obj[K]
  }

  // BetterPick START
  type BetterPickKey<T extends Record<string | number, any>, K = (keyof T & string | number) | `${keyof T & string | number}->${string}`> =
    K | `?${K & string | number}`

  type BetterPick<T extends Record<string | number, any>, K extends BetterPickKey<T>> = {
    [P in (K extends `${infer PS}${infer K1}->${string}` ? PS extends '?' ? never : `${PS}${K1}` : K extends `?${string}` ? never : K) as K extends `?${P & string | number}->${infer K2}` ? K2 : P]: T[P]
  } & {
    [P in (K extends `${infer PS}${infer K1}->${string}` ? PS extends '?' ? K1 : never : K extends `?${infer K1}` ? K1 : never) as K extends `?${P & string | number}->${infer K2}` ? K2 : P]?: T[P]
  }
  // ToTuple END

  export {
    RecursiveKeyOf,
    IgnoreKeyPrefix,
    DeepPartial,
    BetterPick,
  }
}

export namespace WStr {
  type FirstUppercase<Str extends string> = Str extends `${infer First}${infer Rest}`
    ? `${Uppercase<First>}${Rest}`
    : never

  export {
      FirstUppercase,
  }
}
