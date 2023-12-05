import { definePreset } from '@unocss/core'

const unoPresetRemBaseFontSize = 50 // default: 16
const remRE = /(-?[.\d]+)rem/g

/// 將值轉換為對應的數字 rem，比方說 unoPresetRemBaseFontSize 10, text-1 = 0.1rem
const presetRem = definePreset(() => {

	return {
		name: '@unocss/preset-rem',
		postprocess: util => {
			util.entries.forEach(e => {
				const value = e[1]
				if (typeof value === 'string' && remRE.test(value))
					e[1] = value.replace(remRE, (_, p1) => `${p1 / unoPresetRemBaseFontSize * 4}rem`)
			})
		},
	}
})

export { unoPresetRemBaseFontSize, presetRem }
