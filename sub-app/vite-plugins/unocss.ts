import Unocss from 'unocss/vite'
import { presetIcons, presetUno } from 'unocss'

export default function createUnocss() {
  return Unocss({
    presets: [
      presetUno(),
      presetIcons({
        extraProperties: {
          'display': 'inline-block',
          'vertical-align': 'middle',
        },
      }),
    ],
  })
}
