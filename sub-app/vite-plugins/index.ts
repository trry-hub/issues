import type { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueLegacy from '@vitejs/plugin-legacy'

// import createInspector from './inspector'
// import createAutoImport from './auto-import'
// import createComponents from './components'
// import createSpritesmith from './spritesmith'
import createUnocss from './unocss'
// import createSvgIcon from './svg-icon'
// import createConsole from './console'

export default function createVitePlugins(viteEnv, isBuild = false) {
  const vitePlugins: (PluginOption | PluginOption[])[] = [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('media-'),
        },
      },
    }),
    vueJsx(),
    vueLegacy({
      renderLegacyChunks: false,
      modernPolyfills: [
        'es.array.at',
        'es.array.find-last',
      ],
    }),
  ]
  // vitePlugins.push(createInspector())
  // vitePlugins.push(...createAutoImport())
  // vitePlugins.push(createComponents())
  // vitePlugins.push(...createSpritesmith(isBuild))
  vitePlugins.push(createUnocss())
  // vitePlugins.push(createSvgIcon())
  // vitePlugins.push(createConsole())
  return vitePlugins
}
