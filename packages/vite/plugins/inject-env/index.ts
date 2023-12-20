import type { Plugin } from "vite";
import {log} from "../../../../utils/log.ts";

type InjectEnvOptions = {
  env: Record<string, any>
  rootPropName?: string
  importModuleName?: string
  exportModuleName?: string
}

const PLUGIN_NAME = 'inject-env'
const FULL_PLUGIN_NAME = `vite-plugin-wtbx-${PLUGIN_NAME}`
const DEFAULT_IMPORT_MODULE_NAME = 'env-config'
const DEFAULT_EXPORT_MODULE_NAME = 'envConfig'

function injectEnv(options: InjectEnvOptions): any {
  if (options.importModuleName == null) options.importModuleName = DEFAULT_IMPORT_MODULE_NAME
  if (options.exportModuleName == null) options.exportModuleName = DEFAULT_EXPORT_MODULE_NAME

  const V_MODULE_NAME = `~${options.importModuleName}`
  const V_MODULE_ID = `@@${V_MODULE_NAME}`

  const plugin: Plugin = {
    name: FULL_PLUGIN_NAME,
    config() {
      log.info(`已開啟環境注入功能，模塊名為 ${options.importModuleName}，export 名為 ${options.exportModuleName}`)
    },
    resolveId(id) {
      if (id === V_MODULE_NAME) {
        return V_MODULE_ID
      }
    },
    load(id) {
      if (id === V_MODULE_ID) {
        return (
          `const ${options.exportModuleName} = ${JSON.stringify(options.env[options.rootPropName || 'vite'])}
          export { ${options.exportModuleName} }`
        )
      }
    },
  }

  return plugin
}

export type {
  InjectEnvOptions,
}

export {
  injectEnv,
}
