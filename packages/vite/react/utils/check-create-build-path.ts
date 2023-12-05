import fs from 'fs/promises'
import path from 'path'
import { getBuildPath } from './get-build-path'

async function _checkCreateGitIgnoreFile() {
	const gitIgnorePath = path.resolve(getBuildPath(), './.gitignore')

	try {
		await fs.access(gitIgnorePath)
	} catch {
		await fs.writeFile(gitIgnorePath, '*')
	}
}

async function checkCreateBuildPath() {
	const buildPath = getBuildPath()

	try {
		await fs.access(buildPath)
		await _checkCreateGitIgnoreFile()
	} catch {
		await fs.mkdir(buildPath, { recursive: true })
		await _checkCreateGitIgnoreFile()
	}
}

export { checkCreateBuildPath }
