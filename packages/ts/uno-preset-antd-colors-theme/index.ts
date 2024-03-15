import { definePreset } from '@unocss/core'
import {
	red,
	volcano,
	orange,
	gold,
	yellow,
	lime,
	green,
	cyan,
	blue,
	geekblue,
	purple,
	magenta,
	grey,
	gray,
} from '@ant-design/colors'

const presetAntdColorsTheme = definePreset(() => {
	return {
		name: '@unocss/preset-antd-colors-theme',
		theme: {
			colors: {
				...passAntColors('red', red),
				...passAntColors('volcano', volcano),
				...passAntColors('orange', orange),
				...passAntColors('gold', gold),
				...passAntColors('yellow', yellow),
				...passAntColors('lime', lime),
				...passAntColors('green', green),
				...passAntColors('cyan', cyan),
				...passAntColors('blue', blue),
				...passAntColors('geekblue', geekblue),
				...passAntColors('purple', purple),
				...passAntColors('magenta', magenta),
				...passAntColors('grey', grey),
				...passAntColors('gray', gray),
			},
		},
	}
})

function passAntColors(
	colorName: string,
	antColors: string[] & {
		primary?: string | undefined
	},
) {
	const result: Record<string, string> = {}

	antColors.forEach((e, i) => {
		result[`${colorName}${i + 1}`] = e
	})
	if (antColors.primary != null) result[colorName] = antColors.primary

	return result
}

export { presetAntdColorsTheme }
