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

	const idxes = [0] as number[]
	let current = 0

	return {
		value: text[0],
		next(): string {
			/*
			ab
			a b
			aa ab ba bb
			aaa aab aba abb baa bab bba bbb
			*/
			console.log(idxes, idxes.length - 1, current)
			for (let i = idxes.length - 1; i >= current; i--) {
				if (idxes[i] >= text.length) {
					if (i === current) {
						current--

						if (current < 0) {
							for (let i = 0; i < idxes.length; i++) {
								idxes[i] = 0
							}

							idxes.push(0)
							current = idxes.length - 1
						} else {
							idxes[current]++
							for (let i = current + 1; i < idxes.length; i++) {
								idxes[i] = 0
							}
						}

						return _result(text, idxes)
					} else {
						continue
					}
				} else {
					idxes[i]++
				}
			}

			return _result(text, idxes)
		},
	}
}

function _result(text: string, idxes: number[]) {
	return idxes.reduce((p, i) => p + text[i], '')
}

const id = autoIncrement('ab')
console.log(id.value)
// 6 | 15
for (let i = 0; i < 15; i++) {
	console.log(id.next())
}

export { autoIncrement }
