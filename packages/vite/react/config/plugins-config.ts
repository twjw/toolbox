import UnoCSS from 'unocss/vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import { createHtmlPlugin } from 'vite-plugin-html'
import { PluginOption } from 'vite'
import path from 'path'
import { unoPresetRemBaseFontSize } from '../plugins/unocss/plugins/preset-rem'
import { RequireEnv } from '../type'

function pluginsConfig<Env extends RequireEnv & { mode: any }>(envConfig: Env): PluginOption[] {
	return [
		UnoCSS({
			configFile: path.relative(__dirname, path.join(process.cwd(), 'uno.config.ts')),
		}),
		react(),
		svgr(),
		createHtmlPlugin({
			minify: envConfig.mode !== 'development',
			inject: {
				data: {
					title: envConfig.project.title,
					htmlFontSize: `${unoPresetRemBaseFontSize}px`,
				},
			},
		}),
	]
}

export { pluginsConfig }
