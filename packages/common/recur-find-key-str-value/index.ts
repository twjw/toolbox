import { recurFindKeyValue } from '../recur-find-key-value'
import { wObject } from '../../type'

const recurFindKeyStrValue = <T extends object>(
	obj: T,
	key: wObject.RecursiveKeyOf<T, '.'>,
) => {
	const value = recurFindKeyValue<T>(obj, key)

	if (typeof value === 'string') return value

	return key
}

export { recurFindKeyStrValue }
