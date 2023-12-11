import { recurFindKeyValue } from '../recur-find-key-value'
import { WObject } from '../../type'

const recurFindKeyStrValue = <T extends object>(
	obj: T,
	key: WObject.RecursiveKeyOf<T, '.'>,
) => {
	const value = recurFindKeyValue<T>(obj, key)

	if (typeof value === 'string') return value

	return key
}

export { recurFindKeyStrValue }
