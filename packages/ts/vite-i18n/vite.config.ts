import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { i18n } from './src'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		i18n({
			dirs: [path.resolve(process.cwd(), 'example/assets/locales')],
		}),
	],
	publicDir: false,
	root: path.resolve(process.cwd(), 'example'),
	resolve: {
		alias: {
			'wtbx-vite-i18n': path.resolve(process.cwd(), 'src'),
		},
	},
	server: {
		port: 9487,
	},
})
