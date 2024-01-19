import type { Plugin } from 'vite'

const PLUGIN_NAME = '@wtbx/vite-build-drop-log'
const FULL_PLUGIN_NAME = `vite-plugin-${PLUGIN_NAME}`
const CONSOLE_NAME = `[${PLUGIN_NAME}]`

function buildDropLog(): any {
  const plugin: Plugin = {
    name: FULL_PLUGIN_NAME,
    enforce: 'pre',
    config(_, { command }) {
      if (command === 'build') {
        console.log(`[LOG]${CONSOLE_NAME} 已開啟 console 清除功能`)
        return {
          esbuild: {
            drop: ['console', 'debugger'],
          },
        }
      }
    },
  }

  return plugin
}

export { buildDropLog }
