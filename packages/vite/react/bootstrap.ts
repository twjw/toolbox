import { defineConfig, UserConfig } from 'vite'
import { ConfigExt, createEnvConfig, TransformEnvConfig } from './utils/create-env-config'
import { pluginsConfig } from './config/plugins-config'
import { resolveConfig } from './config/resolve-config'
import { RequireEnv } from './type'

type BootstrapOptions<Env, Mode> = {
	mode: Mode
	envExt?: ConfigExt
	envTransform?: TransformEnvConfig<Env & { mode: Mode }, Mode>
}

type UserConfigCallback<Env, Mode> = (env: Env & { mode: Mode }) => {
	env?: { transform: TransformEnvConfig<Env, Mode>, ext: ConfigExt }
} & UserConfig

async function bootstrap<Env extends RequireEnv = RequireEnv, Mode = string>({ mode, envExt, envTransform }: BootstrapOptions<Env, Mode>, userConfigCallback: UserConfigCallback<Env, Mode>) {
	const envConfig = await createEnvConfig<Env, Mode>(mode, envExt, envTransform)
	const { plugins = [], resolve, server, ...userConfig } = userConfigCallback(envConfig)

	return defineConfig({
		plugins: [
			...pluginsConfig(envConfig),
			...plugins,
		],
		resolve: {
			...await resolveConfig(envConfig),
			...resolve,
		},
		server,
		...userConfig,
	})
}

export { bootstrap }
