import path from 'path'

function getBuildPath() {
	return path.resolve(process.cwd(), `./.wtbx-build`)
}

export { getBuildPath }
