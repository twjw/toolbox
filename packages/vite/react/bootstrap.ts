import { defineConfig, UserConfig } from 'vite'
import { ConfigExt, createEnvConfig, TransformEnvConfig } from './utils/create-env-config'
import {createViteAliasFromTsconfig} from "./utils/create-vite-alias-from-tsconfig.ts";

type BootstrapOptions<Env, Mode> = {
	tsconfigFilename?: string
	tsconfigFilepath?: string
	envDirPath?: string
	envExt?: ConfigExt
	envTransform?: TransformEnvConfig<Env & { mode: Mode }, Mode>
}

type CreateUserConfig<Env> = (params: {
	envConfig: Env
	resolveAlias: Record<string, any>
}) => Promise<UserConfig>

function bootstrap<Env, Mode = string>(options?: BootstrapOptions<Env, Mode>, createUserConfig?: CreateUserConfig<Env & { mode: Mode }>) {
	return async ({ mode }: { mode: Mode }): Promise<UserConfig> => {
		const { tsconfigFilename, tsconfigFilepath, envDirPath, envExt, envTransform } = options || {}
		const envConfig = await createEnvConfig<Env, Mode>(mode, envDirPath, envExt, envTransform)

		if (!createUserConfig) return defineConfig({})

		return await createUserConfig({
			envConfig,
			resolveAlias: await createViteAliasFromTsconfig({ filename: tsconfigFilename, filepath: tsconfigFilepath }),
		})
	}
}

export { bootstrap }
