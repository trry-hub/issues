<script setup lang="ts">
import eruda from 'eruda'
import { onMounted } from 'vue';
import Player, { Events } from 'xgplayer'
import FlvPlugin from 'xgplayer-flv'
import 'xgplayer/dist/index.min.css';

eruda.init()

let playList = [
  'https://play.yaomaitong.net/qxs-live/fb02f685b5b5750643d7d7a7cd468f44_FSD1000.flv',
  'https://play.yaomaitong.net/qxs-live/fb02f685b5b5750643d7d7a7cd468f44_FSD1000.m3u8',
  'rtmp://play.yaomaitong.net/qxs-live/fb02f685b5b5750643d7d7a7cd468f44_FSD1000',
  'webrtc://play.yaomaitong.net/qxs-live/fb02f685b5b5750643d7d7a7cd468f44_FSD1000'
]

const url = (() => {
  if ("MediaSource" in window) {
    let isCanPlayFlv = MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')
    if(isCanPlayFlv) {
      return playList[0]
    }else {
      return playList[1]
    }
  }
  return playList[1]
})()
const opt = {
  id: 'player',
  url,
  poster: '',
  isLive: true,
  autoplay: true,
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
  ],
  ...getVideoConfig(url)
}
function getVideoConfig(url: string) {
  const extension = url.toLowerCase().split('.').pop();

  switch (extension) {
    case 'flv':
      return {
        plugins: [FlvPlugin],
        isLive: true,
      };
  }
}

onMounted(() => {
  const player = new Player(opt)
  player.on(Events.ERROR, (error) => {
    console.log('error: ', error)
    if ([2, 3].includes(error.networkState) && opt.isLive || error.httpCode === 404) {
      setTimeout(() => {
        player.switchURL(opt.url)
        // player.reload()
        // player.playNext({url: opt.url})
      }, 3000);
    }
  })
})

</script>

<template>
  <div class="page-container">
    <div id="player" class="player-box"></div>
    <div class="placeholder">
      test
    </div>
  </div>
</template>

<style lang="scss">
body {
  padding: 0;
  margin: 0;
}
</style>
<style lang="scss" scoped>
.page-container {
  border: 1px solid #333;

  .player-box {
    width: 100%;
    aspect-ratio: 16 / 9;
  }

  .placeholder {
    height: 200vh;
    border: 1px solid #ff6700;
  }
}
</style>