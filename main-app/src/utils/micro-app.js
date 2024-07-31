import microApp, { getActiveApps } from '@micro-zoe/micro-app'
import router from '../router'
microApp.start()

// 主应用中
microApp.addDataListener('v3', event => {
  const { postType } = event
  if (postType === 'navigate') {
    // 接收到子应用的路由跳转事件
    event.callBack(router)
  }
  if (postType === 'toLogin') {
    console.log('toLogin: ')
  }
})

export function pushState(appName = 'v3', callBack) {
  /**
   * 当子应用还未渲染，通过基座控制路由跳转，子应用在初始化时会自己根据url渲染对应的页面
   * 当子应用已经渲染，则直接控制子应用进行内部跳转
   *
   * getActiveApps: 用于获取正在运行的子应用
   */
  if (getActiveApps().includes(appName)) {
    // 主应用通过下发data数据控制子应用跳转
    microApp.setData(appName, {
      type: 'navigate',
      callBack
    })
  } else {
    microApp.setData(appName, { type: 'loginInfo', data: {} })
    // 主应用跳转
    // callBack(router)
  }
}

export * from '@micro-zoe/micro-app'
