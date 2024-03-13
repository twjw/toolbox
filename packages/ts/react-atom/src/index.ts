import { useSyncExternalStore } from 'react'

type VoidFn = () => void

type WatchListener<T> = (before: T, after: T) => void
type Watch<T> = (listener: WatchListener<T>) => () => void

type SetModel<T> = {
	(value: T): void
	(updater: (before: T) => T): void
}

type ApiModel<T> = {
	use: T
	value: T
	watch: Watch<T>
}

type Model<T> = T & SetModel<T> & ApiModel<T>

const keywordUse = 'use'
const keywordWatch = 'watch'

function watom<T>(model: T) {
	const ref = { value: model }
	const listeners: Set<VoidFn> = new Set()
	const watchers: Set<WatchListener<T>> = new Set()

	function subscribe(listener: VoidFn) {
		listeners.add(listener)
		return () => listeners.delete(listener)
	}

	function getSnapshot() {
		return ref.value
	}

	function watch(listener: WatchListener<T>) {
		watchers.add(listener)
		return () => watchers.delete(listener)
	}

	return new Proxy((() => undefined) as unknown as Model<T>, {
		get(_, k) {
			if (k === keywordUse) return useSyncExternalStore(subscribe, getSnapshot)
			if (k === keywordWatch) return watch
			return ref.value
		},
		set() {
			throw new Error('[wtbx-react-atom] 不可直接更改數據')
		},
		apply(_, __, [updaterOrVal]) {
			const oldValue = ref.value
			const newValue = updaterOrVal instanceof Function ? updaterOrVal(oldValue) : updaterOrVal

			if (ref.value === newValue) return

			ref.value = newValue
			listeners.forEach(e => e())
			if (watchers.size > 0) {
				watchers.forEach(e => e(oldValue, newValue))
			}
		},
	})
}

export { watom }
