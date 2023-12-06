import type { Plugin } from "vite";

function reactPagesPlugin (): any {
  const plugin: Plugin = {
      name: 'vite-plugin-react-pages',
      enforce: 'pre',
      configureServer(server) {
        server.watcher
          .on('unlink', async (path) => {
            console.log(`unlink:${path}`)
          })

        server.watcher
          .on('add', async (path) => {
            console.log(`add:${path}`)
          })

        server.watcher
          .on('change', async (path) => {
            console.log(`change:${path}`)
          })
      }
    }

  return plugin as any
}

export {
  reactPagesPlugin
}
