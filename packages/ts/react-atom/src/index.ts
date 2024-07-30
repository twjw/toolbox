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

type KeyOfMap<M extends Map<unknown, unknown>> = M extends Map<infer K, unknown> ? K : never

type PrivateAtom = Atom<any> &
	Partial<
		// 更換該 atom 的 value
		Record<typeof REF_PK_COMBINE_VALUE, () => void>
	>

type AtomRef = Map<typeof REF_K_USE, VoidFn> &
	Map<typeof REF_K_WATCH, (listener: WatchListener<any>) => void> &
	Map<typeof REF_K_VALUE, any> &
	Map<typeof REF_PK_ATOM, PrivateAtom> &
	Map<typeof REF_PK_COMBINE_VALUE, VoidFn>

const REF_K_USE = 'use'
const REF_K_WATCH = 'watch'
const REF_K_VALUE = 'value'
const REF_PK_ATOM = 'a'
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
	const ref = new Map() as AtomRef
	const atom = new Proxy((() => undefined) as unknown as PrivateAtom, atomHandler(ref) as any)
	const _subscribe = (listener: VoidFn) => subscribe(atom, listener)
	const _getSnapshot = () => ref.get(REF_K_VALUE)!

	// 塞入 ref 值
	if (isCombineValue) {
		ref.set(REF_K_VALUE, combineAtoms(atom, initialValue as AtomInitialCombineFunction<T>))
	} else {
		ref.set(REF_K_VALUE, initialValue)
	}
	ref.set(REF_PK_ATOM, atom)
	ref.set(REF_K_USE, () => useSyncExternalStore(_subscribe, _getSnapshot))
	ref.set(REF_K_WATCH, (listener: WatchListener<any>) => watch(atom, listener))
	ref.set(REF_PK_COMBINE_VALUE, () => {
		ref.set(REF_K_VALUE, (initialValue as AtomInitialCombineFunction<T>)(getAtomValue))
	})

	listeners.set(atom, new Set())
	watchers.set(atom, new Set())

	return atom as Atom<T>
}

function atomHandler(ref: AtomRef) {
	return {
		get: atomGet.bind(ref),
		set: atomSet.bind(ref),
		apply: atomApply.bind(ref),
	}
}

function atomGet(this: AtomRef, _: any, k: KeyOfMap<AtomRef>) {
	return this.get(k)
}

function atomSet(this: AtomRef) {
	throw new Error('[wtbx-react-atom] Data cannot be changed directly')
}

function atomApply(this: AtomRef, _: any, __: any, [updaterOrVal]: [AtomUpdater<any> | any]) {
	const oldValue = this.get(REF_K_VALUE)
	const newValue = updaterOrVal instanceof Function ? updaterOrVal(oldValue) : updaterOrVal

	if (oldValue === newValue) return

	this.set(REF_K_VALUE, newValue)

	const atom = this.get(REF_PK_ATOM)
	emitListener(atom, oldValue, newValue)
	emitCombinerAtoms(atomCombiners.get(atom), oldValue, newValue)
}

function subscribe(atom: PrivateAtom, listener: VoidFn) {
	listeners.get(atom)!.add(listener)
	return () => listeners.get(atom)!.delete(listener)
}

function watch(atom: PrivateAtom, listener: WatchListener<any>) {
	watchers.get(atom)!.add(listener)
	return () => watchers.get(atom)!.delete(listener)
}

function getAtomValue(atom: PrivateAtom) {
	return atom.value
}

function combineAtoms<T>(atom: PrivateAtom, combineValue: AtomInitialCombineFunction<T>): T {
	return combineValue((combineAtom: PrivateAtom) => {
		if (atomCombiners.get(combineAtom) == null) atomCombiners.set(combineAtom, new Set())
		atomCombiners.get(combineAtom)!.add(atom)
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
