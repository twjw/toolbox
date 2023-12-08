import type { Plugin } from "vite";
import fs from "fs";

type NiceI18nOptions = {
  dirs: string[] // 字典檔目錄絕對路徑列表(後蓋前)
}

const PLUGIN_NAME = 'nice-i18n'
const V_MODULE_NAME = 'virtual:nice-i18n'
const V_MODULE_ID = `@@${V_MODULE_NAME}`

function niceI18n(options: NiceI18nOptions): any {
  const _options = options
  let langs = [] as string[] // zh_TW, en, ...

  const plugin: Plugin = {
    name: `vite-plugin-${PLUGIN_NAME}`,
    enforce: 'pre',
    configResolved() {
      fs.
    },
    resolveId(id) {
      if (id === V_MODULE_NAME) {
        return V_MODULE_ID;
      }
    },
    load(id) {
      if (id === V_MODULE_ID) {
        return `
          import myModule from './path/to/myModule.js';
          export function useMyModule() {
            return myModule;
          }
        `;
      }
    }
  }

  return plugin
}

export type {
  NiceI18nOptions,
}

export {
  niceI18n,
}
