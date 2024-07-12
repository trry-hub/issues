<script setup lang="ts">
import Artplayer from 'artplayer'
import { onMounted, ref } from 'vue'
import {artplayerPluginVttThumbnail,artplayerSegmentPlugin} from './plugins'

import { res, subtitlesVTT, chaptersVTT } from './res'

let theme = '#3d61e3'
const artRef = ref<HTMLDivElement>()
const art = ref<Artplayer>(null)
onMounted(() => {
  art.value = new Artplayer({
    url: res.videoInfo.playUrl.filter((item) => item.includes('mp4'))[0],
    poster: res.videoInfo.coverUrl,
    container: artRef.value!,
    theme,
    hotkey: true,
    pip: true,
    mutex: true,
    fullscreen: true,
    fullscreenWeb: true,
    miniProgressBar: true,
    playsInline: true,
    layers: [
      {
        name: 'potser',
        html: `<img style="width: 100px" src="${res.videoInfo.coverUrl}">`,
        style: {
          position: 'absolute',
          top: '20px',
          right: '20px',
          opacity: '.9',
        },
        click: function (...args) {
          console.info('click', args)
        },
        mounted: function (...args) {
          console.info('mounted', args)
        },
      },
    ],
    plugins: [
      // artplayerPluginVttThumbnail({}),
      artplayerSegmentPlugin({segments:res.autoChapters})
    ],
    subtitle: {
      url: subtitlesVTT(res.transcription.paragraphs).src,
      type: 'vtt',
      encoding: 'utf-8',
      escape: true,
    },
    lock: true,
    autoOrientation: true,
    autoPlayback: true,
  })
  console.log('instance: ', art)
})

// const subtitles = subtitlesVTT(copyDetail.value.transcription.paragraphs)
//     playerRef.value!.mediaPlayer!.textTracks.add(subtitles)
//     const chapters = chaptersVTT(copyDetail.value.autoChapters)
</script>

<template>
  <div class="artplayer-app" ref="artRef"></div>
</template>

<style scoped lang="scss">
.artplayer-app {
  max-width: 50%;
  max-height: 100%;
  margin: 0 auto;
  // height: 400px;
  aspect-ratio: 16/9;
}
</style>
