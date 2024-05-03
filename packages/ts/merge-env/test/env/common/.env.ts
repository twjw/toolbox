import { execSync } from 'child_process'
import { helloWorld } from '../helper'

function version() {
	const commitId = execSync('git rev-parse HEAD')?.toString()
	return `v_${commitId.substring(0, 8)}`
}

const envConfig = {
	port: 9247,
	version: version(),
	hello: helloWorld(),
	// 測試合併的參數
	merge: {
		dir: 'common',
		name: '.env.ts',
	},
}

export type EnvType = typeof envConfig
export type EnvMode = 'development' | 'production'
export type ClintEnv = { mode: EnvMode } & {
	version: EnvType['version']
}
export default envConfig
