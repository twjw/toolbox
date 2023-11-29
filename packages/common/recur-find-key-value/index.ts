type RecursiveKeyOf<Obj extends object, Sep extends string = '.'> = {
  [K in keyof Obj & (string | number)]:
  Obj[K] extends object
    ? `${K}` | `${K}${Sep}${RecursiveKeyOf<Obj[K]>}`
    : `${K}`;
}[keyof Obj & (string | number)];

const recurFindKeyValue = <T extends object, Sep extends string = '.'>(obj: T, key: RecursiveKeyOf<T, Sep>, separator?: Sep) => {
  const keys = key.split(separator || '.')
  let result: any = obj
  let k

  while((k = keys.shift()) != null) {
    result = result[k]
    if (typeof result !== 'object') break
  }

  if (keys.length > 0)
    return key

  return result
}

export type {
  RecursiveKeyOf,
}

export {
  recurFindKeyValue
}
