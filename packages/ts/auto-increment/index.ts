type AutoIncrementInstance<T extends string | number> = {
	value: T
	next(): T
}

const a_z = 'abcdefghijklmnopqrstuvwxyz'
const A_Z = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const A_z = a_z + A_Z

function autoIncrement<T extends string | number>(n: T): AutoIncrementInstance<T> {
	if (typeof n === 'number') {
		return {
			value: n,
			next() {
				;(this.value as number)++
				return this.value
			},
		}
	}

	let idxes = [] as number[]
	let idx = 0

	return {
		value: n[0] as T,
		next() {
			if (idxes.length === 0) {
				idxes.push(0)
			} else {
				if (idxes[idx] + 1 === n.length) {
					if (idxes.length > 1) {
						for (let i = idx - 1; i >= 0; i--) {
							if (idxes[i] + 1 < n.length) {
								for (let j = i + 1; j < idxes.length; j++) {
									idxes[j] = 0
								}
								idxes[i]++
								break
							} else if (i === 0) {
								idxes = Array((idx = idxes.length) + 1).fill(0)
							}
						}
					} else {
						idxes = Array((idx = idxes.length) + 1).fill(0)
					}
				} else {
					idxes[idx]++
				}
			}

			return idxes.reduce<string>((p, i) => p + n[i], '') as T
		},
	}
}

// const id = autoIncrement('ab')
// const results = ['a', 'b', 'aa', 'ab', 'ba', 'bb', 'aaa', 'aab', 'aba', 'abb', 'baa', 'bab', 'bba', 'bbb', 'aaaa', 'aaab', 'aaba', 'aabb', 'abaa', 'abab', 'abba', 'abbb', 'baaa', 'baab', 'baba', 'babb', 'bbaa', 'bbab', 'bbba', 'bbbb', 'aaaaa']
//
// const id = autoIncrement('abc')
// const results = ['a', 'b', 'c', 'aa', 'ab', 'ac', 'ba', 'bb', 'bc', 'ca', 'cb', 'cc', 'aaa', 'aab', 'aac', 'aba', 'abb', 'abc', 'aca', 'acb', 'acc', 'baa', 'bab', 'bac', 'bba', 'bbb', 'bbc', 'bca', 'bcb', 'bcc', 'caa', 'cab', 'cac', 'cba', 'cbb', 'cbc', 'cca', 'ccb', 'ccc', 'aaaa', 'aaab', 'aaac', 'aaba', 'aabb', 'aabc', 'aaca', 'aacb', 'aacc', 'abaa', 'abab', 'abac', 'abba', 'abbb', 'abbc', 'abca', 'abcb', 'abcc', 'acaa', 'acab', 'acac', 'acba', 'acbb', 'acbc', 'acca', 'accb', 'accc', 'baaa', 'baab']
//
// for (let i = 0; i < results.length; i++) {
// 	const value = id.next()
//
// 	console.log('id.next()', i, value)
//
// 	if (value !== results[i]) {
// 		console.log('error break')
// 		break
// 	}
//
// 	if (i === results.length - 1) {
// 		console.log('success')
// 	}
// }

export { type AutoIncrementInstance, a_z, A_Z, A_z, autoIncrement }
