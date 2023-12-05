import { forEach, isObject, isFunction } from 'lodash-es'

function recursiveRemoveKey(obj: Record<string, any>, key: string | ((k: string) => boolean)) {
	forEach(obj, function (value, _key) {
		if (isObject(value)) {
			recursiveRemoveKey(value, key)
		}

		const match = isFunction(key) ? (key as Function)(_key) : _key === key

		if (match) {
			delete obj[_key]
		}
	})

	return obj
}

export { recursiveRemoveKey }
