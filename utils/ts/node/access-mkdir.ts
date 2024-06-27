import fs from 'node:fs/promises'
import path from 'node:path'

export type CheckCreateDirOptions = {
	gitignore?: boolean
}

export async function accessMkdir(dirPath: string, options = {} as CheckCreateDirOptions) {
	const { gitignore = false } = options
	try {
		await fs.access(dirPath)
	} catch {
		await fs.mkdir(dirPath, { recursive: true })
	} finally {
		if (gitignore) {
			await fs.writeFile(path.join(dirPath, '.gitignore'), '*')
		}
	}
}
