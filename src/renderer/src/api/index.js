// API配置文件索引
// 根据环境选择使用HTTP API或IPC API

// 导入两种API实现
import httpApi from './config'
import ipcApi from './ipc_config'

// 根据环境和可用性选择API实现
const api = window.ipcApi ? ipcApi : httpApi

// 导出API实例
export default api
