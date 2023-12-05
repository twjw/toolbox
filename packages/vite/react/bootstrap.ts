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

type UserConfigCallback<Env, Mode> = (env: Env) => UserConfig

function bootstrap<Env extends RequireEnv, Mode = string>(options?: BootstrapOptions<Env, Mode>, userConfigCallback?: UserConfigCallback<Env & { mode: Mode }, Mode>) {
	return async ({ mode }: { mode: Mode }) => {
		const { envExt, envTransform } = options || {}
		const envConfig = await createEnvConfig<Env, Mode>(mode, envExt, envTransform)
		const basePlugins = pluginsConfig(envConfig)
		const baseResolve = await resolveConfig(envConfig)

		if (!userConfigCallback) {
			return {
				plugins: basePlugins,
				resolve: baseResolve,
			}
		}

		const { plugins = [], resolve = {}, server, ...userConfig } = userConfigCallback(envConfig)

		return defineConfig({
			plugins: [
				...basePlugins,
				...plugins,
			],
			resolve: {
				...baseResolve,
				...resolve,
			},
			server,
			...userConfig,
		})
	}
}

export { bootstrap }
