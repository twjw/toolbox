import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { pageRoutes } from 'wtbx-vite-react-page-routes'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		pageRoutes({
			pages: [
				path.resolve(process.cwd(), 'pages', 'common'),
				path.resolve(process.cwd(), 'pages', 'common-plus'),
				path.resolve(process.cwd(), 'pages', 'purple'),
			],
		}),
	],
	publicDir: false,
	server: {
		port: 9487,
	},
})
