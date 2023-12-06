import { StateCreator, StoreApi } from 'zustand/vanilla'
import { stringifyStorage } from '../../storage-utils'

type StorageKeys<T> = T extends object
	? {
			[K in keyof T]?: {
				storage?: Storage
			}
	  }
	: never

type SetStateAction<T> =
	| T
	| Partial<T>
	| {
			_(state: T): T | Partial<T>
	  }

const zmStorage =
	<T>(initializer: StateCreator<T>, storageKeyMap?: StorageKeys<T>) =>
	<API extends StoreApi<any> = StoreApi<T>>(
		set: API['setState'],
		get: API['getState'],
		store: API,
	) => {
		store.setState = (setStateAction: SetStateAction<T>, replace?: boolean | undefined) => {
			const newState: Partial<T> =
				typeof setStateAction === 'function' ? setStateAction(get()) : setStateAction

			for (const k in storageKeyMap) {
				if (newState[k as keyof T] != null) {
					const driver = storageKeyMap[k]!.storage || localStorage
					driver.setItem(k, stringifyStorage(newState[k as keyof T]))
				}
			}

			set(newState, replace)
		}

		return initializer(store.setState, get, store)
	}

export { zmStorage }
