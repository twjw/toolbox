import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { i18n } from 'wtbx-vite-react-i18n'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		i18n({
			locales: ['zh_CN', 'en_US'],
			dirs: [
				path.resolve(process.cwd(), 'dictionaries/one'),
				path.resolve(process.cwd(), 'dictionaries/two'),
			],
		}),
	],
	publicDir: false,
	server: {
		port: 9487,
	},
})
