import type { Plugin } from "vite";

type ModuleOptions = {
  clean?: boolean
}

const PLUGIN_NAME = 'build-drop-log'
const FULL_PLUGIN_NAME = `vite-plugin-${PLUGIN_NAME}`

function buildDropLog(options?: ModuleOptions): any {
  const { clean = true } = options || {}

  const plugin: Plugin = {
    name: FULL_PLUGIN_NAME,
    enforce: 'pre',
    config(config) {
      if (config.build && clean) {
        return {
          esbuild: {
            drop: ['console', 'debugger'],
          }
        }
      }
    },
  }

  return plugin
}

export {
  buildDropLog,
}
