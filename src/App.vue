<script setup lang="ts">
import eruda from 'eruda'
import { onMounted } from 'vue';
import Player from 'xgplayer'
import 'xgplayer/dist/index.min.css';

eruda.init()

onMounted(() => {
  const player = new Player({
    id: 'player',
    url: 'http://s2.pstatp.com/cdn/expire-1-M/byted-player-videos/1.0.0/xgplayer-demo.mp4',
  })
})
</script>

<template>
  <div id="player"></div>
</template>

<style lang="scss" scoped>
#player{
  width: 100%;
}
</style>