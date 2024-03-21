const hasOwnProperty = Object.prototype.hasOwnProperty

export function newJsx(createElement, map) {
	return function (...args) {
		// args[1] 是 props
		if (args[1]) {
			for (let k in map) {
				if (hasOwnProperty.call(args[1], k)) {
					return createElement(map[k], args[1], createElement(...args))
				}
			}
		}

		return createElement(...args)
	}
}
