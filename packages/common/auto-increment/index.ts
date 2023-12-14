function autoIncrement(text?: string) {
	if (text == null) {
		return {
			value: 1,
			next(): number {
				this.value++
				return this.value
			},
		}
	} else if (text.length === 1) {
		return {
			value: text[0],
			next(): string {
				this.value += text[0]
				return this.value
			},
		}
	}

	const idxes = [] as number[]
	let current = 0 // 為索引+1

	return {
		value: text[0],
		next(): string {
			/*
			ab
			-
			a   b
			[0] [1]
			-
			aa     ab      ba      bb
			[0, 0] [0, 1], [1, 0], [1, 1]
			-
			aaa        aab        aba        abb        baa        bab        bba        bbb
			[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1], [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1]
			*/
			if (idxes.length === 0) {
				idxes.push(0)
			} else if (idxes.length === 1) {
				idxes[0]++
				if (idxes[0] >= text.length) {
					idxes[0] = 0
					idxes.push(0)
					current = idxes.length
				}
			} else {
			}

			return idxes.reduce((p, i) => p + text[i], '')
		},
	}
}

function _result(text: string, idxes: number[]) {
	return idxes.reduce((p, i) => p + text[i], '')
}

const id = autoIncrement('ab')
console.log('id.value ', id.value)
// 6 | 15
for (let i = 0; i < 15; i++) {
	const value = id.next()
	if (i >= 0) {
		console.log('id.next()', i, value)
	}
}

export { autoIncrement }
