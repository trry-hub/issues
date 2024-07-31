<template>
  <micro-app
    :data="{ type: 'loginInfo', data: {} }"
    :url="fullPath"
    name="v3"
    disable-patch-request
    iframe
    router-mode="native"
    :baseroute="baseroute"
    @created="created"
    @beforemount="beforemount"
    @mounted="mounted"
    @unmount="unmount"
  />
</template>

<script>
import { pushState } from '@/utils/micro-app'
export default {
  name: 'MicroAppView',
  data() {
    return {
      baseroute: '/sub-app',
      isShowLog: false
    }
  },
  computed: {
    fullPath() {
      return `http://localhost:5173/v3/`
    },
    defaultPage() {
      if (!this.$route.meta.config) {
        return
      }
      let path = `${this.$route.meta.config.microAppUrl}`
      for (const key in this.$route.params) {
        path = path.replace(`:${key}`, this.$route.params[key])
      }
      // 将 query 参数拼接成查询字符串
      const searchParams = this.$route.query
      delete searchParams.v3
      const queryParams = new URLSearchParams(this.$route.query).toString()

      // 如果有查询参数，则拼接到路径
      if (queryParams) {
        path += `?${queryParams}`
      }
      return path
    }
  },
  methods: {
    created() {
      if (this.isShowLog) {
        console.log('created')
      }
    },
    beforemount() {
      if (this.isShowLog) {
        console.log('beforemount')
      }
    },
    mounted() {
      pushState('v3', v3Router => {
        if (v3Router.currentRoute.value.fullPath !== this.$route.fullPath) {
          const path = this.$route.fullPath.replace(this.baseroute, '')
          v3Router.push(path)
        }
      })
      if (this.isShowLog) {
        console.log('mounted')
      }
    },
    unmount() {
      if (this.isShowLog) {
        console.log('unmount')
      }
    },
    error() {
      if (this.isShowLog) {
        console.log('error')
      }
    }
  }
}
</script>
