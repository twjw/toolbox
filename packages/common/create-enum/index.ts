namespace Enum {
	export type values<T extends readonly any[][]> = T[number] extends [string, ...infer Rest]
		? T
		: never
}

const _DEFAULT_DATA_KEYS = ['label', 'value'] as const

function createEnum<KS extends readonly string[] | undefined, VS extends readonly any[][]>(
	dataKeys: KS,
	values: Enum.values<VS>,
) {
	type NumberKS = KS extends undefined
		? (typeof _DEFAULT_DATA_KEYS)[number]
		: (typeof _DEFAULT_DATA_KEYS)[number] | (KS & readonly string[])[number]

	type ResultKS = KS extends undefined
		? typeof _DEFAULT_DATA_KEYS
		: [...typeof _DEFAULT_DATA_KEYS, ...(KS & readonly string[])]

	type DataKeyIdx<DK extends NumberKS, DKS = ResultKS, Idxes extends 1[] = []> = DKS extends [
		infer A,
		...infer R,
	]
		? A extends DK
			? Idxes['length']
			: DataKeyIdx<DK, R, [...Idxes, 1]>
		: Idxes['length']

	return {
		_isInit: 0, // 0 | 1
		_dataKeyIdxes: {} as Record<NumberKS, number>,
		_labelIdxes: {} as Record<Enum.values<VS>[number][0], number>,
		_valueIdxes: {} as Record<Enum.values<VS>[number][1], number>,
		_init() {
			const _dataKeys = (_DEFAULT_DATA_KEYS as any).concat(dataKeys || [])
			for (let i = 0; i < values.length; i++) {
				if (i === 0) {
					for (let j = 0; j < values[i].length; j++) {
						this._dataKeyIdxes[_dataKeys[j] as NumberKS] = j
					}
				}

				this._labelIdxes[values[i][0] as Enum.values<VS>[number][0]] = i
				this._valueIdxes[values[i][1] as Enum.values<VS>[number][1]] = i
			}

			this._isInit = 1
		},
		getByLabel<DK extends NumberKS = (typeof _DEFAULT_DATA_KEYS)[1] & NumberKS>(
			label: Enum.values<VS>[number][0],
			dataKey?: DK,
		): Enum.values<VS>[number][DataKeyIdx<DK>] {
			if (this._isInit === 0) this._init()
			return values[this._labelIdxes[label]]?.[dataKey ? this._dataKeyIdxes[dataKey] : 1]
		},
		getByValue<DK extends NumberKS = (typeof _DEFAULT_DATA_KEYS)[0] & NumberKS>(
			value: Enum.values<VS>[number][1],
			dataKey?: DK,
		): Enum.values<VS>[number][DataKeyIdx<DK>] {
			if (this._isInit === 0) this._init()
			return values[this._valueIdxes[value]]?.[dataKey ? this._dataKeyIdxes[dataKey] : 1]
		},
		map<U>(callback: (value: Enum.values<VS>[number], index: number) => U): U[] {
			if (this._isInit === 0) this._init()

			let result: U[] = []
			for (let i = 0; i < values.length; i++) {
				result.push(callback(values[i], i))
			}

			return result
		},
	}
}

export { createEnum }
