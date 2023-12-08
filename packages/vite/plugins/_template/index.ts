import type { Plugin } from "vite";

type ModuleOptions = {}

const PLUGIN_NAME = 'PLUGIN_NAME'

function MODULE_NAME(options?: ModuleOptions): any {
  const _options = options || {}

  const plugin: Plugin = {
    name: `vite-plugin-${PLUGIN_NAME}`,
  }

  return plugin
}

export type {
  ModuleOptions,
}

export {
  MODULE_NAME,
}
