declare interface Window {
  webkitDevicePixelRatio: any
  mozDevicePixelRatio: any
  mount?: () => void
  unmount?: () => void
  microApp: any
  __MICRO_APP_ENVIRONMENT__: boolean
  __MICRO_APP_UMD_MODE__: boolean
  __MICRO_APP_PUBLIC_PATH__: string
  __MICRO_APP_BASE_ROUTE__: string
  eventCenterForAppNameVite: any
  AliyunUpload: any
}

declare const __SYSTEM_INFO__: {
  pkg: {
    version: string
    dependencies: Recordable<string>
    devDependencies: Recordable<string>
  }
  lastBuildTime: string
}

declare module '*.scss' {
  const content: { [className: string]: string }
  export default content
}
