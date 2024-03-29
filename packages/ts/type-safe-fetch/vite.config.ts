import { defineConfig } from 'vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [],
	publicDir: false,
	root: path.resolve(process.cwd(), 'example'),
	resolve: {
		alias: {
			'wtbx-type-safe-fetch': path.resolve(process.cwd(), 'src'),
		},
	},
	server: {
		port: 9487,
		proxy: {
			'/v1': 'https://api.thecatapi.com',
		},
	},
})
