
declare interface Window {
  webkitDevicePixelRatio: any
  mozDevicePixelRatio: any
  mount?: () => void
  unmount?: () => void
  microApp: any
  __MICRO_APP_ENVIRONMENT__: boolean
  __MICRO_APP_UMD_MODE__: boolean
}