import autoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default function createAutoImport() {
  return [
    autoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
      ],
      dts: './typings/auto-imports.d.ts',
      dirs: [
        './src/utils/composables/**',
      ],
      resolvers: [
        ElementPlusResolver({ importStyle: 'sass' }),
        IconsResolver({
          prefix: 'Icon',
        }),
      ],
    }),
    Icons({
      autoInstall: true,
    }),
  ]
}
