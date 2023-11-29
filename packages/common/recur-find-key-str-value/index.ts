import type { RecursiveKeyOf } from '../recur-find-key-value'
import { recurFindKeyValue } from '../recur-find-key-value'

const recurFindKeyStrValue = <T extends object>(obj: T, key: RecursiveKeyOf<T, '.'>) => {
  const value = recurFindKeyValue<T>(obj, key)

  if (typeof value === 'string') return value

  return key
}

export {
  recurFindKeyStrValue
}
