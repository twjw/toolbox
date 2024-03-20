type Eval = string | number | boolean

type UppercaseFirst<S extends string> = S extends `${infer A}${infer B}`
	? `${Uppercase<A & string>}${B & string}`
	: S

type EqualsLabelRecord<
	T extends Record<string, Record<string, Eval>>,
	RK extends string,
	V extends Eval,
> = {
	[K in keyof T as T[K][RK] extends V ? K : never]: K
}

type EnumGetResultByLabelKey<
	T extends Record<string, Record<string, Eval>>,
	RK extends string,
	V extends Eval,
> = EqualsLabelRecord<T, RK, V> extends Record<infer LK, any> ? LK : never

type EqualsRkeyRecord<
	T extends Record<string, Record<string, Eval>>,
	RK extends string,
	V extends Eval,
	PK extends string,
> = {
	[K in keyof T as T[K][RK] extends V ? K : never]: T[K][PK]
}

type EnumGetResultByRkey<
	T extends Record<string, Record<string, Eval>>,
	RK extends string,
	V extends Eval,
	PK extends string,
> = EqualsRkeyRecord<T, RK, V, PK> extends Record<string, infer V> ? V : never

type EnumInstance<
	T extends Record<string, Record<string, Eval>>,
	LK extends string,
	FTK extends string,
> = {
	[K in keyof T]: T[K]
} & {
	[K in FTK as `getBy${UppercaseFirst<K & string>}`]: <
		PV extends T[keyof T][K],
		PK extends FTK | LK,
	>(
		val: PV,
		key: PK,
	) => PK extends LK ? EnumGetResultByLabelKey<T, K, PV> : EnumGetResultByRkey<T, K, PV, PK>
} & {
	[K in '0' as `getBy${UppercaseFirst<LK>}`]: <PV extends keyof T, PK extends keyof T[PV] | LK>(
		val: PV,
		key: PK,
	) => PK extends LK ? PV : T[PV][PK]
} & { keys: (keyof T)[] }

function wenum<
	T extends Record<string, Record<string, Eval>>,
	LK extends string = 'label',
	FTK extends string = T extends Record<string, infer R2> ? keyof R2 : never,
>(data: () => T, labelKey = 'label' as LK): EnumInstance<T, LK, FTK> {
	const _data = data()
	const keys: (keyof T)[] = Object.keys(_data)
	const result = _data as EnumInstance<T, LK, FTK>
	let cacheMap: Map<Eval, keyof T> | undefined

	function newCache() {
		cacheMap = new Map()

		for (let i = 0; i < keys.length; i++) {
			const k = keys[i]
			for (const rk in result[k]) {
				cacheMap.set(result[k][rk], k)
			}
		}
	}

	function getByKeyVal(val: Eval, key: FTK | LK) {
		if (cacheMap == null) newCache()
		const label = cacheMap!.get(val)!
		return label ? result[label][key] || (key == null ? null : label) : null
	}

	function getByLabel(val: keyof T, key: FTK) {
		if (cacheMap == null) newCache()
		return result[val] ? result[val][key] || val : null
	}

	for (let k in _data) {
		for (const k2 in _data[k]) {
			;(result[`getBy${k2[0].toUpperCase()}${k2.substring(1)}`] as any) = getByKeyVal
		}
		break
	}

	;(result[`getBy${labelKey[0].toUpperCase()}${labelKey.substring(1)}`] as any) = getByLabel

	result.keys = keys

	return result
}

export { wenum }
