import fs from 'fs/promises'
import path from 'path'

async function checkMkdirBuildFolderAndGitIgnore(packageName: string) {
	const buildPath = getBuildPath(packageName)

	try {
		await fs.access(buildPath)
	} catch {
		await fs.mkdir(buildPath, { recursive: true })
	} finally {
		const gitIgnorePath = path.resolve(getBuildPath(packageName), './.gitignore')

		try {
			await fs.access(gitIgnorePath)
		} catch {
			await fs.writeFile(gitIgnorePath, '*')
		}
	}
}

function getBuildPath(packageName: string) {
	return path.resolve(process.cwd(), `node_modules/${packageName}/.vb`)
}

export { getBuildPath, checkMkdirBuildFolderAndGitIgnore }
