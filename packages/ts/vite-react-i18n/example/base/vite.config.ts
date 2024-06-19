import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { i18n } from 'wtbx-vite-react-i18n'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		i18n({
			uniteFilepath: path.resolve(process.cwd(), '.dictionary.json'),
			dirs: [path.resolve(process.cwd(), 'assets/locales')],
		}),
	],
	publicDir: false,
	server: {
		port: 9487,
	},
})
