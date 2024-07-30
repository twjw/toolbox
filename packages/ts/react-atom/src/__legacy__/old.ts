import { useSyncExternalStore } from 'react'

export type WatchListener<T> = (before: T, after: T) => void
export type Watch<T> = (listener: WatchListener<T>) => () => void

export type AtomUpdater<T> = {
	(value: T): void
	(updater: (before: T) => T): void
}

export type AtomApis<T> = {
	use: T
	value: T
	watch: Watch<T>
}

export type Atom<T> = T & AtomUpdater<T> & AtomApis<T>

export type AtomInitialCombineFunction<T> = (
	get: <M extends Atom<any>>(atom: M) => M extends Atom<infer MT> ? MT : never,
) => T

export type AtomInitialValue<T> = T | AtomInitialCombineFunction<T>

type VoidFn = () => void

type PrivateAtom = Atom<any> &
	Partial<
		// 取該 atom id
		| Record<typeof keywordAtomId, number>
		// 更換該 atom 的 value
		| Record<typeof keywordAtomUpdateCombineValue, () => void>
	>

const keywordUse = 'use'
const keywordWatch = 'watch'
const keywordAtomId = '$1'
const keywordAtomUpdateCombineValue = '$2'
/** @desc useSyncExternalStore 監聽的事件們(以 atomId 區分) */
const listeners: Record<number, Set<VoidFn>> = {}
/** @desc watch 監聽的事件們(以 atomId 區分) */
const watchers: Record<number, Set<WatchListener<any>>> = {}
/** @desc atomId 關聯的 id 們，值裡的 id 為 key id 原子變動時要調用的 id 們 */
const idCombiners: Record<number, Set<PrivateAtom>> = {}
let atomId = 0

export function watom<T>(initialValue: AtomInitialValue<T>) {
	const id = atomId++
	const isCombineValue = typeof initialValue === 'function'
	let value = isCombineValue ? (undefined as T) : initialValue

	listeners[id] = new Set()
	watchers[id] = new Set()

	const result = new Proxy((() => undefined) as unknown as PrivateAtom, {
		get(_, k) {
			if (k === keywordUse) return useSyncExternalStore(subscribe(id), getSnapshot)
			if (k === keywordWatch) return watch(id)
			if (k === keywordAtomId) return id
			if (k === keywordAtomUpdateCombineValue) return updateCurrentValue
			return value
		},
		set() {
			throw new Error('[wtbx-react-atom] Data cannot be changed directly')
		},
		apply(_, __, [updaterOrVal]) {
			const oldValue = value
			const newValue = updaterOrVal instanceof Function ? updaterOrVal(oldValue) : updaterOrVal

			if (value === newValue) return

			value = newValue

			listeners[id].forEach(fn => fn())
			watchers[id].forEach(fn => fn(oldValue, newValue))
			emitCombinerAtoms(idCombiners[id], oldValue, newValue)
		},
	})

	if (isCombineValue) {
		value = combineAtoms(result, initialValue as AtomInitialCombineFunction<T>)
	}

	function getSnapshot() {
		return value
	}

	function updateCurrentValue() {
		value = (initialValue as AtomInitialCombineFunction<T>)(getAtomValue)
	}

	return result as Atom<T>
}

function subscribe(id: number) {
	return function (listener: VoidFn) {
		listeners[id].add(listener)
		return () => listeners[id].delete(listener)
	}
}

function watch(id: number) {
	return function (listener: WatchListener<any>) {
		watchers[id].add(listener)
		return () => watchers[id].delete(listener)
	}
}

function getAtomValue(atom: PrivateAtom) {
	return atom.value
}

function combineAtoms<T>(result: PrivateAtom, combineValue: AtomInitialCombineFunction<T>): T {
	return combineValue((atom: PrivateAtom) => {
		const combineAtomId = atom[keywordAtomId] as number
		if (idCombiners[combineAtomId] == null) idCombiners[combineAtomId] = new Set()
		idCombiners[combineAtomId].add(result)
		return atom.value
	})
}

function emitCombinerAtoms(
	combinerAtoms: Set<PrivateAtom> | undefined,
	oldValue: any,
	newValue: any,
) {
	if (!combinerAtoms) return

	combinerAtoms.forEach(atom => {
		const combineId = atom[keywordAtomId]
		atom[keywordAtomUpdateCombineValue]()
		listeners[combineId].forEach(fn => fn())
		watchers[combineId].forEach(fn => fn(oldValue, newValue))
	})
}
