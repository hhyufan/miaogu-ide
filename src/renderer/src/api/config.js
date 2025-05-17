// API配置文件
import axios from 'axios'

// 获取API基础URL
// 修改获取基础URL的方式
const getBaseUrl = () => {
  // 生产环境使用5000端口
  if (process.env.NODE_ENV === 'production') {
    return 'http://localhost:5000'
  }
  // 开发环境使用代理
  return ''
}

// 创建axios实例
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 0, // 设置为0表示取消超时限制
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证信息等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API请求错误:', error)
    return Promise.reject(error)
  }
)

export default api
