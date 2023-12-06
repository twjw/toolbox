import path from 'path'

function getBuildPath() {
	return path.resolve(process.cwd(), `./node_modules/.wtbx-build`)
}

export { getBuildPath }
