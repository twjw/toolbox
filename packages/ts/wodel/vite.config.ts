import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	publicDir: false,
	root: path.resolve(process.cwd(), 'example'),
	server: {
		port: 9487,
	},
})
