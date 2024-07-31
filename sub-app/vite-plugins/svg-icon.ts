import path from 'node:path'
import process from 'node:process'
import type { ViteSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

export default function createSvgIcon() {
  const svgoOptions: ViteSvgIconsPlugin['svgoOptions'] = {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // 配置 convertColors 插件不要更改颜色属性
            convertColors: {
              currentColor: false,
            },
          },
        },
      },
    ],
  }
  return createSvgIconsPlugin({
    iconDirs: [path.resolve(process.cwd(), 'src/assets/icons/')],
    symbolId: 'icon-[dir]-[name]',
    svgoOptions,
  })
}
