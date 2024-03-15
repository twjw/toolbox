import { definePreset } from '@unocss/core'

export type PresetRemOptions = {
	baseFontSize: number
}

const remRE = /(-?[.\d]+)rem/g

/// 將值轉換為對應的數字 rem，比方說 unoPresetRemBaseFontSize 10, text-1 = 0.1rem
const presetRem121 = definePreset((options?: PresetRemOptions) => {
	const { baseFontSize = 16 } = options || {}

	return {
		name: '@unocss/preset-rem-121',
		postprocess: util => {
			util.entries.forEach(e => {
				const value = e[1]
				if (typeof value === 'string' && remRE.test(value))
					e[1] = value.replace(remRE, (_, p1) => `${(p1 / baseFontSize) * 4}rem`)
			})
		},
	}
})

export { presetRem121 }
