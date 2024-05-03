import { mergeEnv } from '../index'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

mergeEnv({
	dirs: [path.resolve(__dirname, 'env/common'), path.resolve(__dirname, 'env/last')],
})
