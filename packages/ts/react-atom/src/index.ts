import { useSyncExternalStore } from 'react'

export type WatchListener<T> = (before: T, after: T) => void

export type Watch<T> = (listener: WatchListener<T>) => () => void

export type AtomUpdater<T> = {
	(value: T): T
	(updater: (before: T) => T): T
}

export type AtomApis<T> = Record<typeof REF_K_USE, () => T> &
	Record<typeof REF_K_WATCH, Watch<T>> &
	Record<typeof REF_K_VALUE, T>

export type Atom<T> = T & AtomUpdater<T> & AtomApis<T>

export type AtomInitialCombineFunction<T> = (
	get: <M extends Atom<any>>(atom: M) => M extends Atom<infer MT> ? MT : never,
) => T

export type AtomInitialValue<T> = T | AtomInitialCombineFunction<T>

type VoidFn = () => void

type PrivateAtom = Atom<any> &
	Partial<
		// 更換該 atom 的 value
		Record<typeof REF_PK_COMBINE_VALUE, () => void>
	>

const REF_K_USE = 'use'
const REF_K_WATCH = 'watch'
const REF_K_VALUE = 'value'
const REF_PK_COMBINE_VALUE = 'c'
/** @desc useSyncExternalStore 監聽的事件們(以 atomId 區分) */
const listeners: Map<PrivateAtom, Set<VoidFn>> = new Map()
/** @desc watch 監聽的事件們(以 atomId 區分) */
const watchers: Map<PrivateAtom, Set<WatchListener<any>>> = new Map()
/** @desc atomId 關聯的 id 們，值裡的 id 為 key id 原子變動時要調用的 id 們 */
const atomCombiners: Map<PrivateAtom, Set<PrivateAtom>> = new Map()

export function watom<T>(initialValue: AtomInitialValue<T>) {
	const isCombineValue = typeof initialValue === 'function'
	// ref 值在下方延遲塞入
	const atom = function (updaterOrVal: AtomUpdater<T> | T) {
		updateAtom.call(atom, updaterOrVal)
	} as PrivateAtom

	atom[REF_K_USE] = useAtom.bind(atom)
	atom[REF_K_WATCH] = watch.bind(atom)

	// 塞入 ref 值
	if (isCombineValue) {
		atom[REF_K_VALUE] = combineAtoms.call(atom, initialValue as AtomInitialCombineFunction<T>)
		atom[REF_PK_COMBINE_VALUE] = () => {
			atom[REF_K_VALUE] = (initialValue as AtomInitialCombineFunction<T>)(getAtomValue)
		}
	} else {
		atom[REF_K_VALUE] = initialValue
	}

	listeners.set(atom, new Set())
	watchers.set(atom, new Set())

	return atom as Atom<T>
}

function useAtom(this: PrivateAtom) {
	return useSyncExternalStore(subscribe.bind(this), () => this[REF_K_VALUE])
}

function updateAtom<T = any>(this: PrivateAtom, updaterOrVal: AtomUpdater<T> | T) {
	const oldValue = this[REF_K_VALUE]
	const newValue = updaterOrVal instanceof Function ? updaterOrVal(oldValue) : updaterOrVal

	if (oldValue === newValue) return

	this[REF_K_VALUE] = newValue

	emitCombinerAtoms(atomCombiners.get(this), oldValue, newValue)
	emitListener(this, oldValue, newValue)
}

function subscribe(this: PrivateAtom, listener: VoidFn) {
	listeners.get(this)!.add(listener)
	return () => listeners.get(this)!.delete(listener)
}

function watch(this: PrivateAtom, listener: WatchListener<any>) {
	watchers.get(this)!.add(listener)
	return () => watchers.get(this)!.delete(listener)
}

function getAtomValue(atom: PrivateAtom) {
	return atom.value
}

function combineAtoms<T>(this: PrivateAtom, combineValue: AtomInitialCombineFunction<T>): T {
	return combineValue((combineAtom: PrivateAtom) => {
		if (atomCombiners.get(combineAtom) == null) atomCombiners.set(combineAtom, new Set())
		atomCombiners.get(combineAtom)!.add(this)
		return combineAtom.value
	})
}

function emitCombinerAtoms(
	combinerAtoms: Set<PrivateAtom> | undefined,
	oldValue: any,
	newValue: any,
) {
	if (!combinerAtoms) return

	combinerAtoms.forEach(combineAtom => {
		combineAtom[REF_PK_COMBINE_VALUE]()
		emitListener(combineAtom, oldValue, newValue)
	})
}

function emitListener(atom: PrivateAtom, oldValue: any, newValue: any) {
	listeners.get(atom)!.forEach(fn => fn())
	watchers.get(atom)!.forEach(fn => fn(oldValue, newValue))
}
