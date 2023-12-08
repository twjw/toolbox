import type { Plugin } from "vite";

function buildDropLog(buildClean = false): any {
  const plugin: Plugin = {
    name: 'vite-plugin-build-drop-log',
    enforce: 'pre',
    config(config) {
      if (config.build && buildClean) {
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
