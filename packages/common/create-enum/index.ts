type _DefaultDataKeys = ['label', 'value']

type _EnumValues<T extends readonly any[][]> = T[number] extends [string, ...infer Rest]
	? T
	: never

type _DataKey<KS = undefined> = KS extends readonly string[]
	? _DefaultDataKeys[number] | KS[number]
	: _DefaultDataKeys[number]

type _ResultKS<KS = undefined> = KS extends readonly string[]
	? [..._DefaultDataKeys, ...KS]
	: _DefaultDataKeys

type _DataKeyIdx<
	DK extends _DataKey<any>,
	DKS = _ResultKS,
	Idxes extends 1[] = [],
> = DKS extends [infer A, ...infer R]
	? A extends DK
		? Idxes['length']
		: _DataKeyIdx<DK, R, [...Idxes, 1]>
	: Idxes['length']

type _CreateEnumReturn<
	KS extends readonly string[] | undefined,
	VS extends readonly any[][],
> = {
	_isInit: 0 | 1
	_dataKeyIdxes: Record<_DataKey<KS>, number>
	_labelIdxes: Record<_EnumValues<VS>[number][0], number>
	_valueIdxes: Record<_EnumValues<VS>[number][1], number>
	_init: () => void
	getByLabel: <DK extends _DataKey<KS> = _DefaultDataKeys[1] & _DataKey<KS>>(
		label: _EnumValues<VS>[number][0],
		dataKey?: DK,
	) => _EnumValues<VS>[number][_DataKeyIdx<DK>]
	getByValue: <DK extends _DataKey<KS> = _DefaultDataKeys[0] & _DataKey<KS>>(
		label: _EnumValues<VS>[number][1],
		dataKey?: DK,
	) => _EnumValues<VS>[number][_DataKeyIdx<DK>]
	map: <U>(callback: (value: _EnumValues<VS>[number], index: number) => U) => U[]
}

const _DEFAULT_DATA_KEYS: _DefaultDataKeys = ['label', 'value']

function createEnum<KS extends readonly string[] | undefined, VS extends readonly any[][]>(
	dataKeys: KS,
	values: _EnumValues<VS>,
): _CreateEnumReturn<KS, VS> {
	return {
		_isInit: 0, // 0 | 1
		_dataKeyIdxes: {} as Record<_DataKey<KS>, number>,
		_labelIdxes: {} as Record<_EnumValues<VS>[number][0], number>,
		_valueIdxes: {} as Record<_EnumValues<VS>[number][1], number>,
		_init() {
			const _dataKeys = (_DEFAULT_DATA_KEYS as any).concat(dataKeys || [])
			for (let i = 0; i < values.length; i++) {
				if (i === 0) {
					for (let j = 0; j < values[i].length; j++) {
						this._dataKeyIdxes[_dataKeys[j] as _DataKey<KS>] = j
					}
				}

				this._labelIdxes[values[i][0] as _EnumValues<VS>[number][0]] = i
				this._valueIdxes[values[i][1] as _EnumValues<VS>[number][1]] = i
			}

			this._isInit = 1
		},
		getByLabel(label, dataKey) {
			if (this._isInit === 0) this._init()
			return values[this._labelIdxes[label]]?.[dataKey ? this._dataKeyIdxes[dataKey] : 1]
		},
		getByValue(value, dataKey) {
			if (this._isInit === 0) this._init()
			return values[this._valueIdxes[value]]?.[dataKey ? this._dataKeyIdxes[dataKey] : 1]
		},
		map(callback) {
			if (this._isInit === 0) this._init()

			let result: any[] = []
			for (let i = 0; i < values.length; i++) {
				result.push(callback(values[i], i))
			}

			return result
		},
	}
}

export { createEnum }
