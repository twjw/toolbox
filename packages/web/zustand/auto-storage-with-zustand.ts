import type { Storage2PropState } from '../../web'
import { Storage2 } from '../../web'
import type { StoreApi, UseBoundStore } from 'zustand'

// 與 Zustand 進行雙向綁定的 Storage2
class AutoStorageWithZustand<
	Prefix extends string,
	PropState extends Storage2PropState,
> extends Storage2<Prefix, PropState> {
	private storageBindKeyMap = {} as {
		[K in keyof PropState]: [string, UseBoundStore<StoreApi<any>>][]
	}

	constructor(prefix: Prefix, state: PropState, driver: Storage = Storage2.defaultDriver) {
		super(prefix, state, driver)

		this.subscribe((key, value) => {
			if (this.storageBindKeyMap[key] != null) {
				for (let i = 0; i < this.storageBindKeyMap[key].length; i++) {
					const [storeKey, store] = this.storageBindKeyMap[key][i]
					store.setState({ [storeKey]: value })
				}
			}
		})
	}

	bind<StoreState extends object>(
		store: UseBoundStore<StoreApi<StoreState>>,
		keyMap: { [K in keyof StoreState]?: keyof PropState },
	) {
		for (const storeKey in keyMap) {
			const storageKey = keyMap[storeKey]!

			if (this.storageBindKeyMap[storageKey] == null) {
				this.storageBindKeyMap[storageKey] = [[storeKey, store]]
			} else {
				this.storageBindKeyMap[storageKey].push([storeKey, store])
			}
		}

		store.subscribe((state, prevState) => {
			for (const storeKey in keyMap) {
				if (state[storeKey] !== prevState[storeKey]) {
					this.update(keyMap[storeKey]!, state[storeKey], false)
				}
			}
		})

		return this
	}
}

export { AutoStorageWithZustand }
