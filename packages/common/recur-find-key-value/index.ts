import {wObject} from "../../type";

const recurFindKeyValue = <T extends object, Sep extends string = '.'>(obj: T, key: wObject.RecursiveKeyOf<T, Sep>, separator?: Sep) => {
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

export {
  recurFindKeyValue
}
