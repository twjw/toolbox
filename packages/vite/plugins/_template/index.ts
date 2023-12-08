import type { Plugin } from "vite";

type ModuleOptions = {}

function MODULE_NAME(options?: ModuleOptions): any {
  const _options = options || {}

  const plugin: Plugin = {
    name: 'vite-plugin-PLUGIN_NAME',
  }

  return plugin
}

export {
  MODULE_NAME,
}
