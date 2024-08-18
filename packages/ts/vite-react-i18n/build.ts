import util from 'node:util'
import fs from 'node:fs/promises'
import { exec } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const promiseExec = util.promisify(exec)

;(async () => {
	console.log('開始編譯代碼\n')

	try {
		const { stdout, stderr } = await promiseExec(
			'tsup-node src/index.ts --platform node --format esm --dts --clean',
		)
		console.log(stdout)
		if (stderr) {
			throw new Error(stderr)
		}
	} catch (error) {
		console.error(error)
	}

	console.log('開始檢查創建 dist/templates')

	try {
		await fs.access(path.join(__dirname, 'dist/templates'))
	} catch {
		await fs.mkdir(path.join(__dirname, 'dist/templates'))
	}

	console.log('開始檢查創建 dist/locales')

	try {
		await fs.access(path.join(__dirname, 'dist/locales'))
	} catch {
		await fs.mkdir(path.join(__dirname, 'dist/locales'))
	}
	await fs.writeFile(path.join(__dirname, 'dist/locales/_'), '')

	console.log('將模板類型拷貝至 dist')

	await fs.copyFile(
		path.join(__dirname, 'src/templates/client.d.ts'),
		path.join(__dirname, 'dist/templates/client.d.ts'),
	)

	console.log('構建完成')
})()
