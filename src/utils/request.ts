import axios from 'axios'
import  hexMD5  from 'md5.js'

// 从原代码中提取的加密密钥
const APP_SECRET = 'your_app_secret' // 需要替换为实际的解密值
const SECRET_KEY = 'your_secret_key' // 需要替换为实际的解密值

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000,
  headers: {'Content-Type': 'application/json;charset=UTF-8'}
})

// 请求拦截器
service.interceptors.request.use(config => {
  // 添加时间戳
  const timestamp = Date.now()
  config.params = {
    ...config.params,
    timestamp
  }

  // 生成签名
  const sign = generateSign(config.params)
  
  // 设置headers
  config.headers = {
    ...config.headers,
    'token': getLoginToken(),
    'timestamp': timestamp,
    'sign': sign
  }

  return config
})

// 响应拦截器
service.interceptors.response.use(
  response => response.data,
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 生成签名（核心逻辑）
function generateSign(params: Record<string, any>): string {
  // 1. 过滤空值参数
  const filteredParams = Object.keys(params)
    .filter(key => params[key] !== '' && params[key] !== undefined)
    .reduce((obj: Record<string, any>, key) => {
      obj[key] = params[key]
      return obj
    }, {})

  // 2. 参数排序
  const sortedParams = paramsStrSort(filteredParams)

  // 3. 拼接密钥
  const signString = `${sortedParams}&${APP_SECRET}`

  // 4. MD5加密
  return hexMD5(signString)
}

// 参数排序方法（保持与原代码一致）
function paramsStrSort(params: Record<string, any>): string {
  return Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
}

// 获取登录token（示例实现）
function getLoginToken(): string {
  // 这里需要实现原代码中的getLoginToken逻辑
  // 可能需要从cookie/localStorage获取
  return localStorage.getItem('token') || ''
}

// 导出常用方法
export default {
  get(url: string, params?: Record<string, any>) {
    return service.get(url, { params })
  },
  
  post(url: string, data?: Record<string, any>) {
    return service.post(url, data)
  },

  secureGet(url: string, params?: Record<string, any>) {
    return service.get(url, {
      params,
      headers: {
        needSign: true
      }
    })
  }
}
