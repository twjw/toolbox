import path from 'path'
import { cycleConvertPngAndWebp } from 'wtbx-vite-cycle-convert-png-and-webp'

export default {
	plugins: [
		cycleConvertPngAndWebp({
			dirs: [path.resolve(process.cwd(), 'public')],
			zipPngSharpOptions: {
				quality: 70,
			},
		}),
	],
}
