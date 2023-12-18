import type { Plugin } from "vite";

type PassPathOptions = {}

const PLUGIN_NAME = 'pass-path'
const FULL_PLUGIN_NAME = `vite-plugin-wtbx-${PLUGIN_NAME}`

function passPath(options?: PassPathOptions): any {
  const _options = options || {}

  const plugin: Plugin = {
    name: FULL_PLUGIN_NAME,
  }

  return plugin
}

export type {
  PassPathOptions,
}

export {
  passPath,
}
