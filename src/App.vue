<script setup lang="ts">
import eruda from 'eruda'
import { onMounted } from 'vue';
import Player, { Events } from 'xgplayer'
import 'xgplayer/dist/index.min.css';

eruda.init()

onMounted(() => {
  const player = new Player({
    id: 'player',
    url: 'http://s2.pstatp.com/cdn/expire-1-M/byted-player-videos/1.0.0/xgplayer-demo.mp4',
    poster: '',
    playsinline: true,
    fluid: true,
    lang: 'zh-cn',
    textTrack: [
      {
        "src": "//lf3-static.bytednsdoc.com/obj/eden-cn/nupenuvpxnuvo/xgplayer_doc/textTrack-1.vtt",
        "label": "字幕1",
        "default": true
      },
      {
        "src": "//lf3-static.bytednsdoc.com/obj/eden-cn/nupenuvpxnuvo/xgplayer_doc/textTrack-2.vtt",
        "label": "字幕2",
        "default": false
      }
    ],
    progressDot: [
      {
        "time": 3,
        "text": "text1"
      },
      {
        "time": 5,
        "text": `<div>text2</div>`
      },
      {
        "time": 32,
        "text": "text3"
      },
      {
        "time": 36,
        "text": "text4"
      }
    ]
  })
  player.on(Events.ERROR, (error) => {
    console.log('error: ', error)
    // TODO
  })
})
</script>

<template>
  <div class="player-box">
    <div id="player"></div>
  </div>
</template>

<style lang="scss" scoped>
.player-box {
  width: 100%;
  aspect-ratio: 16 / 9;
}
</style>