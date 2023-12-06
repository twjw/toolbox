
import { createViteAliasFromTsconfig } from "./utils/create-vite-alias-from-tsconfig.ts";
import { ConfigExt, createEnvConfig, TransformEnvConfig } from '../../node'

type BootstrapOptions<Env, Mode> = {
	mode: Mode
	tsconfigFilename?: string
	tsconfigFilepath?: string
	envDirPath?: string
	envExt?: ConfigExt
	envTransform?: TransformEnvConfig<Env & { mode: Mode }>
}

type CreateUserConfig<Env> = (params: {
	envConfig: Env
	resolveAlias: Record<string, any>
}) => Promise<any>

async function bootstrap<Env = any, Mode = string>(options: BootstrapOptions<Env, Mode>, createUserConfig: CreateUserConfig<Env & { mode: Mode }>) {
	const { mode, tsconfigFilename, tsconfigFilepath, envDirPath, envExt, envTransform } = options || {}

	const envConfig = await createEnvConfig<Env, Mode>(mode, envDirPath, envExt, envTransform)

	const resolveAlias = await createViteAliasFromTsconfig({ filename: tsconfigFilename, filepath: tsconfigFilepath })

	return await createUserConfig({
		envConfig,
		resolveAlias,
	})
}

export { bootstrap }
