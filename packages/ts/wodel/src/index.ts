import { useSyncExternalStore } from 'react'

type VoidFn = () => void

type BaseObj = Record<string | number | symbol, any>

type ArrUpdater<T> = (before: T[]) => T[]
type ArrIdxValUpdater<T> = (before: T) => T

type ArrModelUpdater<T> = {
	(i: number, val: T | ArrIdxValUpdater<T>): void
	(arr: T[]): void
	(updater: ArrUpdater<T>): void
}

type ObjUpdater<T extends BaseObj> = (before: T) => Partial<T>
type ObjKeyValUpdater<T extends BaseObj, K extends keyof T> = (before: T[K]) => T[K]

type ObjModelUpdater<T extends BaseObj> = {
	<K extends keyof T>(key: K, val: T[K] | ObjKeyValUpdater<T, K>): void
	(obj: Partial<T>): void
	(updater: ObjUpdater<T>): void
}

type ValModelUpdater<T> = {
	(val: T): void
	(updater: (before: T) => T): void
}

type SetModel<T> = T extends (infer AT)[]
	? ArrModelUpdater<AT>
	: T extends BaseObj
		? ObjModelUpdater<T>
		: ValModelUpdater<T>

type UseModel<T> = {
	use: T
}

type OtherValModel<T> = {
	value: T
}

type Model<T> = T & SetModel<T> & UseModel<T> & OtherValModel<T>

enum ModelType {
	arr,
	obj,
	other,
}

const objStr = '[object Object]'

function partialSet<T extends BaseObj>(from: T, to: Partial<T>) {
	for (let toKey in to) {
		from[toKey] = to[toKey]!
	}
}

function wodel<T>(model: T) {
	let ref = { value: model }
	const modelType: ModelType =
		Object.prototype.toString.call(model) === objStr
			? ModelType.obj
			: Array.isArray(model)
				? ModelType.arr
				: ModelType.other
	const listeners: Set<VoidFn> = new Set()

	function subscribe(listener: VoidFn) {
		listeners.add(listener)
		return () => listeners.delete(listener)
	}

	function getSnapshot() {
		if (modelType === ModelType.obj) return ref.value
		if (modelType === ModelType.arr) return ref.value
		return ref.value
	}

	return new Proxy((() => undefined) as unknown as Model<T>, {
		get(_, k) {
			if (k === 'use') return useSyncExternalStore(subscribe, getSnapshot)
			if (modelType === ModelType.obj) return (ref.value as unknown as BaseObj)[k]
			if (modelType === ModelType.arr) {
				if (k === 'value') return ref.value as unknown as any[]
				return (ref.value as unknown as any[])[Number(k)]
			}
			return ref.value
		},
		set() {
			throw new Error('不可直接更改 wodel 數據')
		},
		apply(_, __, [a1, a2]) {
			if (modelType === ModelType.obj) {
				if (a1 instanceof String) {
					;(ref.value as BaseObj)[a1 as keyof BaseObj] =
						a2 instanceof Function ? a2((ref.value as BaseObj)[a1 as keyof BaseObj]) : a2
				} else if (a1 instanceof Function) {
					partialSet(ref.value as BaseObj, a1(ref.value))
				} else {
					partialSet(ref.value as BaseObj, a1)
				}
			} else if (modelType === ModelType.arr) {
				if (a1 instanceof Number) {
					const i = Number(a1)
					;(ref.value as any[])[i] = a2 instanceof Function ? a2((ref.value as any[])[i]) : a2
				} else if (a1 instanceof Function) {
					ref.value = a1(ref.value)
				} else {
					ref.value = a1
				}
			} else {
				ref.value = a1 instanceof Function ? a1(ref.value) : a1
			}

			listeners.forEach(e => e())
		},
	})
}

export { wodel }
