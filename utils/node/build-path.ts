import fs from 'fs/promises'
import path from 'path'

async function checkNewBuildGitIgnore() {
	const buildPath = getBuildPath()

	try {
		await fs.access(buildPath)
	} catch {
		await fs.mkdir(buildPath, { recursive: true })
	} finally {
		const gitIgnorePath = path.resolve(getBuildPath(), './.gitignore')

		try {
			await fs.access(gitIgnorePath)
		} catch {
			await fs.writeFile(gitIgnorePath, '*')
		}
	}
}

function getBuildPath() {
	return path.resolve(process.cwd(), `./node_modules/.wtbx-build`)
}

export { getBuildPath, checkNewBuildGitIgnore }
