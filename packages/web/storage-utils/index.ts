const trueValues = ['1', 'True', 'true']
const emptyValues = ['', 'null', 'undefined']

const _parseType = <T>(value: T) => {
  return typeof value === 'object'
		? value == null
			? 'null'
			: 'object'
		: typeof value
}

const parseStorage = <T>(key: string, defaultValue: T, driver: Storage = localStorage) => {
	const type = _parseType(defaultValue)
	const value = driver.getItem(key)

	console.log(key, type, value)
	switch (type) {
		case 'number': {
			const n = Number(value)
			return isNaN(n) ? defaultValue : n
		}
		case 'boolean': {
			return value == null ? defaultValue : trueValues.includes(value)
		}
		case 'null': {
			return defaultValue
		}
		default: {
			if (value == null || emptyValues.includes(value))
				return defaultValue

			try {
				return JSON.parse(value)
			} catch {}

			return defaultValue
		}
	}
}

const stringifyStorage = <T>(value: T): string => {
	const type = _parseType(value)

	switch (type) {
		case 'string': {
			return value as string
		}
		case 'number': {
			return String(value)
		}
		case 'boolean': {
			return !value ? '0' : '1'
		}
		default: {
			try {
				return JSON.stringify(value)
			} catch {}

			return ''
		}
	}
}

export {
	parseStorage,
	stringifyStorage,
}
