/// 原本是 js 寫的，複雜類型，趕快所以使用 any type 改 >'''<

type Enum2 = <
	E extends Record<string, any>,
	VK extends Record<string, any>,
	M extends Record<string, any>,
>(
	enumMap: E,
	valKeyMap?: VK,
	methodMap?: M,
) => Enum2Return<E, VK, M>

type Enum2Return<
	E extends Record<string, any>,
	VK extends Record<string, any> = { name: number; value: number },
	M extends Record<string, any> = any,
> = {
	keys: string[]
	values: any[]
	includes: (value: any, key?: keyof E | keyof VK) => boolean
} & {
	[K in keyof E]: E[K] extends any[] ? E[K][0] : E[K]
} & (VK extends Record<string, any>
		? {
				[K in keyof VK]: Record<string, any>
		  }
		: {}) &
	(M extends Record<string, any>
		? {
				[K in keyof M]: M[K]
		  }
		: {})

const E_NAME = '__'

const createIncludes = <Key>(res: { [k: string]: any }) => {
	return (value: any, key?: Key) => {
		if (res == null) return false

		let _key = key == null ? 'value' : key
		return (res as any)[_key]?.[value] != null
	}
}

const enum2: Enum2 = <
	E extends Record<string, any>,
	VK extends Record<string, any>,
	M extends Record<string, any>,
>(
	enumMap: E,
	valKeyMap?: VK,
	methodMap?: M,
) => {
	const keys: (keyof E)[] = []
	const valKeyList: (keyof VK)[] =
		valKeyMap == null ? [] : (Object.keys(valKeyMap) as (keyof VK)[])
	const res = {
		keys,
		values: [],
	} as any

	for (let k in enumMap) {
		const values = enumMap[k]
		let value

		if (Array.isArray(values)) {
			value = values[0] === E_NAME ? k : values[0]

			for (let i = 0; i < values.length; i++) {
				const groupName = valKeyList[i]

				if (groupName == null) break

				if (res[groupName] == null) {
					res[groupName] = { [value]: values[i] }
				} else {
					res[groupName][value] = values[i]
				}
			}
		} else {
			value = values === E_NAME ? k : values
		}

		res[k] = value
		if (res.value == null) {
			res.value = { [value]: value }
		} else {
			res.value[value] = value
		}
		res.values.push(value)
		keys.push(k)
	}

	res.includes = createIncludes<keyof E | keyof VK>(res)

	if (methodMap != null) {
		for (const name in methodMap) {
			res[name] = methodMap[name].bind(res)
		}
	}

	return res as Enum2Return<E, VK, M>
}

export { enum2, E_NAME }
